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

  // Handle user signin
  socket.on("signin", (userId) => {
    if (typeof userId !== "string") {
      console.error("❌ Invalid signin ID:", userId);
      return;
    }

    // Remove old socket (if reconnected)
    Object.entries(clients).forEach(([id, s]) => {
      if (id === userId || s.id === socket.id) {
        delete clients[id];
      }
    });

    clients[userId] = socket;
    socket.userId = userId; // 👈 attach userId to socket

    console.log(`👤 User signed in with ID: ${userId}`);
    console.log("📌 Active Clients:", Object.keys(clients));
  });

  // Handle one-to-one message
  socket.on("message", (msg) => {
    const { sourceId, targetId, message } = msg;

    console.log(`📨 Message from ${sourceId} to ${targetId}: ${message}`);

    const targetSocket = clients[targetId];

    if (targetSocket) {
      targetSocket.emit("message", msg);
      console.log(`✅ Delivered to ${targetId}`);
    } else {
      console.warn(`⚠️ Client ${targetId} not connected`);
    }
  });

  // Message read handler
  socket.on("message_read", ({ senderId, receiverId }) => {
    console.log(`📘 Message from ${senderId} was read by ${receiverId}`);

    const senderSocket = clients[senderId];
    if (senderSocket) {
      senderSocket.emit("message_status_updated", {
        senderId,
        receiverId,
        status: "read",
      });
      console.log(`✅ Notified ${senderId} about read status`);
    } else {
      console.warn(`⚠️ Sender ${senderId} not connected`);
    }
  });

  // Disconnect handler
  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id}`);

    if (socket.userId && clients[socket.userId]) {
      delete clients[socket.userId];
      console.log(`🗑️ Removed ${socket.userId} from active clients`);
    }
  });

  // Socket error handler
  socket.on("error", (error) => {
    console.error("⚠ Socket error:", error);
  });
});

// Health check
app.get("/check", (req, res) => {
  res.json("✅ Server is running fine");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
