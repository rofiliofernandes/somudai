import { Server } from "socket.io";
import { isAllowedOrigin } from "../utils/cors.js";

// Socket.io instance (will be initialized later)
let io;

// Store userId → socketId mapping
const userSocketMap = new Map();

// Initialize socket server
export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (isAllowedOrigin(origin)) {
                    return callback(null, true);
                }

                return callback(new Error("Socket origin not allowed"));
            },
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log(`⚡ User connected: ${socket.id}`);

        const queryUserId = socket.handshake.query.userId;
        if (queryUserId) {
            userSocketMap.set(queryUserId, socket.id);
        }

        io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));

        // Client identifies itself (after login)
        socket.on("identify", (userId) => {
            if (userId) {
                userSocketMap.set(userId, socket.id);
                console.log(`Mapped user ${userId} → ${socket.id}`);
                io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
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

            io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
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
