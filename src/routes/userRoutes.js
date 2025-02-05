const express = require('express');
const { register, login } = require('../controllers/userController');
const User = require('../models/User'); 
const Message = require('../models/Message'); 
const jwt = require('jsonwebtoken');
const authenticateJWT = require('../middleware/auth');
const router = express.Router();

module.exports = function(io) {
    router.post('/register', register);
    router.post('/login', login);

    // Get all users
    router.get('/users', authenticateJWT, async (req, res) => {
        try {
            const users = await User.findAll({ attributes: ['id', 'username'] });
            res.json(users);
        } catch (error) {
            console.error("Error fetching users:", error.message);
            res.status(500).json({ message: "Internal server error" });
        }
    });

    // Send a message
    router.post('/messages', authenticateJWT, async (req, res) => {
        const { senderId, receiverId, text } = req.body;
        try {
            const message = await Message.create({ senderId, receiverId, message: text });
            res.status(201).json(message);
        } catch (error) {
            console.error("Error sending message:", error.message);
            res.status(500).json({ message: "Internal server error" });
        }
    });

    // Get chat history
    router.get('/messages/:userId', authenticateJWT, async (req, res) => {
        const { userId } = req.params;
        try {
            const chatHistory = await Message.findAll({
                where: {
                    [Op.or]: [
                        { senderId: req.user.id, receiverId: userId },
                        { senderId: userId, receiverId: req.user.id },
                    ],
                },
                order: [["createdAt", "ASC"]],
            });
            res.json(chatHistory);
        } catch (error) {
            console.error("Error fetching chat history:", error.message);
            res.status(500).json({ message: "Internal server error" });
        }
    });
    

    // Socket.io setup (moved from here)
    let activeUsers = {}; // To keep track of connected users

    io.on('connection', (socket) => {
        console.log('A user connected');
        
        // Handle user joining
        socket.on('join', (username) => {
            activeUsers[username] = socket.id;
            io.emit('updateUserList', Object.keys(activeUsers)); // Update the user list for all connected clients
        });

        // Handle incoming messages
        socket.on('sendMessage', async (messageData) => {
            const { senderId, receiverId, text } = messageData;

            try {
                const message = await Message.create({ senderId, receiverId, message: text });

                // Emit message to the receiver
                if (activeUsers[receiverId]) {
                    io.to(activeUsers[receiverId]).emit('receiveMessage', message);
                }
                socket.emit('receiveMessage', message); // Optionally send back to sender as well
            } catch (error) {
                console.error('Error saving message:', error);
            }
        });

        // Handle disconnects
        socket.on('disconnect', () => {
            console.log('A user disconnected');
            for (let user in activeUsers) {
                if (activeUsers[user] === socket.id) {
                    delete activeUsers[user];
                    break;
                }
            }
            io.emit('updateUserList', Object.keys(activeUsers)); // Update the user list when someone disconnects
        });
    });

    return router;
};
