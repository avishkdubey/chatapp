const bcrypt = require('bcrypt');
const User = require('../models/User');
const Message = require('../models/Message');
const { Op } = require('sequelize');

const register = async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
        return res.status(400).json({ message: 'User is already associated with us.' });
    }
    const user = await User.create({ username, password: hashedPassword });
    res.status(201).json({ id: user.id, username: user.username });
};

const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;

const login = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: '1h' });
        res.json({ token }); 
    } else {
        res.sendStatus(403);
    }
};

const saveMessage = async (senderId, receiverId, message) => {
    await Message.create({ sender_id: senderId, receiver_id: receiverId, message });
};

const getChatHistory = async (userId) => {
    return await Message.findAll({
        where: {
            [Op.or]: [
                { sender_id: userId },
                { receiver_id: userId }
            ]
        },
        order: [['timestamp', 'ASC']]
    });
};

module.exports = { register, login, saveMessage, getChatHistory };