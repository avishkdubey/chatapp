require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const sequelize = require("./config/db");
const path = require("path");
const Message = require("./models/Message");
const User = require("./models/User");
const { Op } = require("sequelize");

const app = express();

// Step 1: Create the HTTP server
const server = http.createServer(app);

// Step 2: Initialize socket.io with the server
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/users", userRoutes(io)); // Pass io object to userRoutes

// Redirect based on authentication
app.get('/', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from headers
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err) => {
            if (err) {
                return res.redirect('/public/login.html'); // Redirect to login if token is invalid
            }
            return res.redirect('/public/index.html'); // Redirect to chat if token is valid
        });
    } else {
        return res.redirect('/public/login.html'); // Redirect to login if no token
    }
});

let connectedUsers = {};

io.use((socket, next) => {
    const token = socket.handshake.auth.token; // Get token from the handshake
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return next(new Error("Authentication error")); // Handle authentication error
        socket.userId = user.id; // Save user ID to socket
        next();
    });
});

io.on("connection", (socket) => {
    const userId = socket.userId; // Get user ID from socket

    // Add user to activeUsers
    connectedUsers[userId] = socket.id;
    io.emit("updateUserList", Object.keys(connectedUsers));

    // Handle sending messages
    socket.on("sendMessage", async ({ receiverId, message }) => {
        const senderId = userId; // Fetch the sender ID from the authenticated socket
        if (!senderId || !receiverId || !message) {
            console.error("Invalid message payload:", { senderId, receiverId, message });
            return;
        }

        // Save message to database
        try {
            const newMessage = await Message.create({
                senderId,
                receiverId,
                message,
            });

            // Emit the message to the sender and receiver
            io.to(connectedUsers[senderId]).emit("receiveMessage", newMessage);
            io.to(connectedUsers[receiverId]).emit("receiveMessage", newMessage);
        } catch (error) {
            console.error("Error saving message:", error.message);
        }
    });

    // Handle fetching chat history
    socket.on("getChatHistory", async ({ userId }) => {
        try {
            const chatHistory = await Message.findAll({
                where: {
                    [Op.or]: [
                        { senderId: userId, receiverId: socket.userId },
                        { senderId: socket.userId, receiverId: userId },
                    ],
                },
                order: [["createdAt", "ASC"]],
            });

            socket.emit("chatHistory", chatHistory);
        } catch (error) {
            console.error("Error fetching chat history:", error.message);
        }
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
        delete connectedUsers[userId];
        io.emit("updateUserList", Object.keys(connectedUsers));
    });
});

// Start Server & Connect to Database
server.listen(PORT, async () => {
    try {
        await sequelize.authenticate();
        console.log(`Server is running on port ${PORT}`);
    } catch (error) {
        console.error("Error connecting to the database:", error.message);
    }
});
