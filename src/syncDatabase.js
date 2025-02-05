// src/syncDatabase.js

const sequelize = require('./config/db');
const User = require('./models/User');
const Message = require('./models/Message');

const syncDatabase = async () => {
    try {
        await sequelize.sync({ force: true }); // This will drop the tables if they exist and recreate them
        console.log("Database synced!");
    } catch (error) {
        console.error("Error syncing database:", error);
    } finally {
        process.exit(); // Exit the process after syncing
    }
};

syncDatabase();