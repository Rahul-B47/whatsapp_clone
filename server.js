const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*" }
});

app.use(cors());

let clients = {}; // Store active clients

app.get("/", (req, res) => {
    res.send("Socket.IO Server is running...");
});

io.on("connection", (socket) => {
    console.log(`✅ User Connected: ${socket.id}`);

    // Handle user sign-in and store the client with proper ID validation
    socket.on("signin", (id) => {
        if (typeof id !== "string") {
            console.error("❌ Invalid ID received. Expected a string but got:", id);
            return;
        }
        
        console.log(`👤 User signed in with ID: ${id}`);
        clients[id] = socket; // Store the client socket
        console.log("📌 Updated Clients List:", Object.keys(clients));
    });

    socket.on("message",(msg)=>{
        console.log(msg);
        let targetId=msg.targetId;
        if(clients[targetId]) clients[targetId].emit("message",msg);
    })

    // Handle sending messages
    socket.on("sendMessage", (data) => {
        if (!data.sender || !data.message) {
            console.error("⚠ Missing sender or message in data:", data);
            return;
        }
        console.log(`📩 Message from ${data.sender}: ${data.message}`);

        io.emit("receiveMessage", data); // Broadcast message to all clients
    });

    // Handle disconnection and remove the user from the clients list
    socket.on("disconnect", () => {
        console.log(`❌ User Disconnected: ${socket.id}`);

        // Remove disconnected user from the clients list
        for (let userId in clients) {
            if (clients[userId] === socket) {
                delete clients[userId];
                console.log(`🗑️ Removed ${userId} from clients`);
                break;
            }
        }
    });

    // Handle errors
    socket.on("error", (error) => {
        console.error("⚠ Socket Error:", error);
    });
});

app.route("/check").get((req,res)=>{
    return res.json("Ypur App is working Fine");
})

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
