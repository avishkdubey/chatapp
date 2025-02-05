const socket = io({
    auth: {
        token: localStorage.getItem('jwt') // Include JWT in the WebSocket connection
    }
});

socket.on("connect_error", (err) => {
    alert("Connection failed: " + err.message);
    window.location.href = "login.html";
});


let receiverId = null;

const sendMessage = (message) => {
    if (!receiverId) {
        alert("Select a user to chat with!");
        return;
    }
    socket.emit("sendMessage", { senderId: userId, receiverId, text: message });
};

// Attach send button event
document.getElementById("sendButton").addEventListener("click", () => {
    const message = document.getElementById("messageInput").value;
    sendMessage(message);
    document.getElementById("messageInput").value = "";
});

// Update user list dynamically
socket.on("updateUserList", (userList) => {
    const userListContainer = document.getElementById("userList");
    userListContainer.innerHTML = "";
    userList.forEach((userId) => {
        userListContainer.innerHTML += `<li onclick="selectUser('${userId}')">${userId}</li>`;
    });
});

const selectUser = (id) => {
    receiverId = id;
    document.getElementById("selectedUser").textContent = `Chatting with User: ${id}`;
    socket.emit("getChatHistory", id);
};

// Display received messages
socket.on("receiveMessage", (message) => {
    const messageBox = document.getElementById("messageBox");
    messageBox.innerHTML += `<p><b>${message.senderId}:</b> ${message.text}</p>`;
});

// Display chat history
socket.on("chatHistory", (chatHistory) => {
    const messageBox = document.getElementById("messageBox");
    messageBox.innerHTML = "";
    chatHistory.forEach((msg) => {
        messageBox.innerHTML += `<p><b>${msg.senderId}:</b> ${msg.message}</p>`;
    });
});
