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
  res.send("📡 Socket.IO Server is running...");
});

io.on("connection", (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);

  // Handle user signin and store their socket
  socket.on("signin", (id) => {
    if (typeof id !== "string") {
      console.error("❌ Invalid signin ID:", id);
      return;
    }

    // Remove old reference of the same socket if re-signing
    Object.keys(clients).forEach((key) => {
      if (clients[key] === socket) delete clients[key];
    });

    clients[id] = socket;
    console.log(`👤 User signed in with ID: ${id}`);
    console.log("📌 Active Clients:", Object.keys(clients));
  });

  // Handle one-to-one messages
  socket.on("message", (msg) => {
    const { sourceId, targetId, message, path } = msg;
    console.log(`📨 Message from ${sourceId} to ${targetId}: ${message}`);

    if (clients[targetId]) {
      clients[targetId].emit("message", msg); // ✅ Send to receiver only
      console.log(`✅ Delivered to ${targetId}`);
    } else {
      console.warn(`⚠️ Client ${targetId} not connected`);
    }

    // ❌ DO NOT echo back to sender — avoids duplicate message display
  });

  // Handle client disconnect
  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    for (let id in clients) {
      if (clients[id] === socket) {
        delete clients[id];
        console.log(`🗑️ Removed ${id} from active clients`);
        break;
      }
    }
  });

  socket.on("error", (error) => {
    console.error("⚠ Socket error:", error);
  });
});

// Health check endpoint
app.get("/check", (req, res) => {
  res.json("✅ Server is running fine");
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
