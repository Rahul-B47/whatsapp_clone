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

let clients = {}; // { userId: socket }

app.get("/", (req, res) => {
  res.send("Socket.IO Server is running...");
});

io.on("connection", (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);

  socket.on("signin", (id) => {
    if (typeof id !== "string") {
      console.error("❌ Invalid signin ID:", id);
      return;
    }

    // If the user already exists with another socket, remove old one
    Object.keys(clients).forEach((key) => {
      if (clients[key] === socket) delete clients[key];
    });

    clients[id] = socket;
    console.log(`👤 User signed in with ID: ${id}`);
    console.log("📌 Active Clients:", Object.keys(clients));
  });

  socket.on("message", (msg) => {
    const { sourceId, targetId, message, path } = msg;
    console.log(`📩 Message from ${sourceId} to ${targetId}: ${message}`);

    // Emit to recipient
    if (clients[targetId]) {
      clients[targetId].emit("message", msg);
      console.log(`✅ Sent to ${targetId}`);
    } else {
      console.warn(`⚠️ targetId ${targetId} not found in clients.`);
    }

    // Optional: Emit back to sender (useful for echo)
    if (clients[sourceId]) {
      clients[sourceId].emit("message", msg);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id}`);

    // Clean up disconnected socket
    for (let id in clients) {
      if (clients[id] === socket) {
        delete clients[id];
        console.log(`🗑️ Removed ${id} from clients.`);
        break;
      }
    }
  });

  socket.on("error", (error) => {
    console.error("⚠ Socket error:", error);
  });
});

app.get("/check", (req, res) => {
  res.json("✅ Server is running fine");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
