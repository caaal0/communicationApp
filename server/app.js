import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from "http"; // Needed for socket.io
import { Server } from "socket.io";
import routes from './routes.js';
import db from "./firebase.js"; // Firestore instance
import { collection, addDoc } from "firebase/firestore";

const app = express();

const server = http.createServer(app); // Create an HTTP server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Adjust based on frontend URL
    methods: ["GET", "POST"],
  },
});

app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use(routes);

// Enhanced Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Store connected users
  socket.on("register", (userId) => {
    // Associate socket ID with user ID for direct communication
    socket.userId = userId;
    socket.join(userId); // Create a room for this user
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Handle call initiation
  socket.on("callUser", ({ targetUserId, callerId, callerName, signal }) => {
    console.log(`Call from ${callerId} to ${targetUserId}`);
    io.to(targetUserId).emit("incomingCall", {
      callerId,
      callerName,
      signal // This should be the offer
    });
  });

  // Handle call acceptance
  socket.on("acceptCall", ({ targetUserId, signal }) => {
    console.log(`Call accepted by ${targetUserId}`);
    io.to(targetUserId).emit("callAccepted", { 
      signal // This should be the answer
    });
  });

  // Handle WebRTC signaling
  socket.on("signal", ({ targetUserId, signal }) => {
    console.log(`Signaling data from ${socket.id} to ${targetUserId}`);
    io.to(targetUserId).emit("signal", {
      signal,
      from: socket.id
    });
  });

  // Handle call end
  socket.on("endCall", ({ targetUserId }) => {
    io.to(targetUserId).emit("callEnded");
  });

  // Your existing chat handling code
  socket.on("chatMessage", (message) => {
    io.emit("chatMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server socket running on port 5000");
});
export default app;