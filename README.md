# Real-Time Chat Application

This is a **Real-Time Chat Application** built using **Node.js**, **HTML**, **Tailwind CSS**, **JavaScript**, and **Express.js**. It allows users to send and receive messages in real time, with a professional UI and a secure authentication system.

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, Tailwind CSS, JavaScript
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Bcrypt for hashing passwords, Sequelize ORM for database interactions

## Features

1. **JWT Authentication**: Issues JWT tokens upon successful login to authenticate users.
2. **Secure JWT Storage**: JWT tokens are stored securely in local storage for use across sessions.
3. **Login/Signup Pages**: Users can sign up for an account and log in to access the chat.
4. **Password Hashing**: Passwords are securely hashed using **Bcrypt** before being stored in the database.
5. **Chat History**: All chat messages are saved in the database and can be retrieved for a specific user.
6. **Professional UI**: A clean and modern user interface built with **Tailwind CSS**.
7. **User Status**: Shows online/offline status for users in real-time.
8. **Unit Tests**: Basic unit tests are implemented for key features like sending and receiving messages.
9. **Security with Sequelize**: The application uses **Sequelize ORM** to interact with the PostgreSQL database instead of raw SQL queries, ensuring better security and scalability.

## Steps to Set Up the Project

### 1. Clone or Download the Repository
- Create a folder called `chatapp` and download all the files into it.

### 2. Set Up Environment Variables
- Create a `.env` file in the root directory of your project and paste the following lines:
  
  ```env
  DATABASE_URL=postgres://postgres:root@localhost:5432/chatdb
  JWT_SECRET='default'

##  Install Dependencies
 By running 'npm i' command in terminal redirecting to root folder of project.

## Set Up the Database
CREATE DATABASE chatdb;

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Messages Table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    senderId INT REFERENCES users(id),  -- Updated column name
    receiverId INT REFERENCES users(id),  -- Updated column name
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

## Run the Application
npm run dev


## Start Chatting........

## Additional Notes

=> This app is built with security in mind, using bcrypt to hash user passwords and Sequelize ORM to interact with the database instead of raw queries.

=> Real-time chat functionality is implemented using Socket.io.

=> Unit tests are written using Jest and test key features like sending and receiving messages.
