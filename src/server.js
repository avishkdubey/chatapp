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
const server = http.createServer(app);
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
app.use("/api/users", userRoutes(io));

// Redirect based on authentication
app.get('/', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err) => {
            if (err) {
                return res.redirect('/public/login.html');
            }
            return res.redirect('/public/index.html');
        });
    } else {
        return res.redirect('/public/login.html');
    }
});

let connectedUsers = {};

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return next(new Error("Authentication error"));
        socket.userId = user.id;
        next();
    });
});

io.on("connection", (socket) => {
    const userId = socket.userId;
    connectedUsers[userId] = socket.id;
    io.emit("updateUserList", Object.keys(connectedUsers));

    socket.on("sendMessage", async ({ receiverId, message }) => {
        const senderId = userId;
        if (!senderId || !receiverId || !message) {
            console.error("Invalid message payload:", { senderId, receiverId, message });
            return;
        }

        try {
            const newMessage = await Message.create({
                senderId,
                receiverId,
                message,
            });

            io.to(connectedUsers[senderId]).emit("receiveMessage", newMessage);
            io.to(connectedUsers[receiverId]).emit("receiveMessage", newMessage);
        } catch (error) {
            console.error("Error saving message:", error.message);
        }
    });

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

    socket.on("disconnect", () => {
        delete connectedUsers[userId];
        io.emit("updateUserList", Object.keys(connectedUsers));
    });
});

server.listen(PORT, async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        console.log(`Server is running on port ${PORT}`);
    } catch (error) {
        console.error("Error connecting to the database:", error.message);
    }
});
