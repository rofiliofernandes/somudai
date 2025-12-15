import { Server } from "socket.io";

// Socket.io instance (will be initialized later)
let io;

// Store userId → socketId mapping
const userSocketMap = new Map();

// Initialize socket server
export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log(`⚡ User connected: ${socket.id}`);

        // Client identifies itself (after login)
        socket.on("identify", (userId) => {
            if (userId) {
                userSocketMap.set(userId, socket.id);
                console.log(`Mapped user ${userId} → ${socket.id}`);
            }
        });

        // Handle disconnects
        socket.on("disconnect", () => {
            for (const [uid, sid] of userSocketMap.entries()) {
                if (sid === socket.id) {
                    userSocketMap.delete(uid);
                    console.log(`User ${uid} disconnected`);
                    break;
                }
            }
        });
    });

    return io;
};

// Helper function: get receiver's socket ID
export const getReceiverSocketId = (userId) => {
    return userSocketMap.get(userId);
};

// Export io instance so controllers can emit events
export { io };
