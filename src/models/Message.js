const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");

class Message extends Model {}

Message.init(
    {
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        receiverId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    { sequelize, modelName: "message" }
);

module.exports = Message;
