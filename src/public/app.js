const jwt = localStorage.getItem('jwt');
const chatWindow = document.getElementById("chatWindow");
const welcomeMessage = document.getElementById("welcomeMessage");
const messageBox = document.getElementById("messageBox");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const userListContainer = document.getElementById("userList");

if (!jwt) {
    window.location.href = "login.html"; // Redirect if not authenticated
}

// Decode JWT
const payload = JSON.parse(atob(jwt.split('.')[1]));
document.getElementById('userInfo').textContent = `Logged in as: ${payload.username}`;

// WebSocket connection
const socket = io('http://localhost:5000', { auth: { token: jwt } });

// Fetch and display user list
const fetchUserList = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/users/users', {
            headers: { Authorization: `Bearer ${jwt}` },
        });
        if (response.ok) {
            const users = await response.json();
            userListContainer.innerHTML = ""; // Clear old list
            users.forEach(user => {
                const listItem = document.createElement("li");
                listItem.classList.add("p-3", "bg-white", "rounded-lg", "shadow", "mb-2", "flex", "items-center", "cursor-pointer", "hover:bg-blue-100");
                listItem.innerHTML = `${user.username}<span id="onlineStatus-${user.id}" class="ml-auto w-3 h-3 bg-gray-400 rounded-full"></span>`;
                listItem.onclick = () => selectUser(user.id, user.username);
                userListContainer.appendChild(listItem);
            });
        } else {
            console.error("Failed to fetch users");
        }
    } catch (error) {
        console.error("Error fetching users:", error);
    }
};

// Select user to chat with and load chat history
const selectUser = (userId, username) => {
    document.getElementById("activeUser").textContent = `Chat with ${username}`;
    welcomeMessage.classList.add("hidden");
    chatWindow.classList.remove("hidden");
    messageBox.innerHTML = "";

    socket.emit("getChatHistory", { userId });
    socket.off("chatHistory").on("chatHistory", (messages) => {
        messageBox.innerHTML = "";
        messages.forEach(msg => {
            const isSender = msg.senderId === payload.id;
            displayMessage(msg.message, isSender);
        });
    });
};

// Display messages in the chat window
function displayMessage(message, isSender) {
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("flex", "w-full");

    const messageDiv = document.createElement("div");
    messageDiv.textContent = message;
    messageDiv.classList.add("p-2", "rounded-lg", "mb-2", "max-w-xs", "break-words", isSender ? "bg-blue-500 text-white ml-auto" : "bg-gray-300 text-black mr-auto");

    messageContainer.classList.add(isSender ? "justify-end" : "justify-start");
    messageContainer.appendChild(messageDiv);
    messageBox.appendChild(messageContainer);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        sendButton.click();
    }
});

sendButton.addEventListener("click", () => {
    const messageContent = messageInput.value.trim();
    if (!messageContent) {
        alert("Please enter a message!");
        return;
    }
    socket.emit("sendMessage", { receiverId: selectedUserId, message: messageContent });
    messageInput.value = "";
});

socket.on("receiveMessage", (message) => {
    const isSender = message.senderId === payload.id;
    displayMessage(message.message, isSender);
});

// Update online status dynamically
socket.on("updateUserList", (activeUserIds) => {
    document.querySelectorAll("[id^='onlineStatus-']").forEach(dot => {
        dot.classList.replace("bg-green-500", "bg-gray-400");
    });
    activeUserIds.forEach(userId => {
        const onlineStatus = document.getElementById(`onlineStatus-${userId}`);
        if (onlineStatus) {
            onlineStatus.classList.replace("bg-gray-400", "bg-green-500");
        }
    });
});

// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("jwt");
    window.location.href = "login.html";
});

// Initial setup
fetchUserList();
