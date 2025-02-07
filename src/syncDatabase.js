const sequelize = require("./config/db");
const User = require("./models/User");
const Message = require("./models/Message");

const syncDatabase = async () => {
    try {
        await sequelize.sync({ force: true });
        console.log("Database synced successfully!");
    } catch (error) {
        console.error("Error syncing database:", error);
    } finally {
        process.exit();
    }
};

syncDatabase();