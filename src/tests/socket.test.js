const { Server } = require("socket.io");
const Client = require("socket.io-client");

let io, clientSocket;

beforeAll((done) => {
    io = new Server(5001, {
        cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
        socket.on("sendMessage", ({ receiverId, message }) => {
            socket.emit("receiveMessage", { receiverId, message });
        });
    });

    clientSocket = new Client("http://localhost:5001");
    clientSocket.on("connect", done);
});

afterAll(() => {
    io.close();
    clientSocket.close();
});

test("Send and receive message", (done) => {
    clientSocket.on("receiveMessage", (msg) => {
        expect(msg).toHaveProperty("receiverId", "123");
        expect(msg).toHaveProperty("message", "Hello");
        done();
    });

    clientSocket.emit("sendMessage", { receiverId: "123", message: "Hello" });
});
