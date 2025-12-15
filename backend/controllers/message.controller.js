import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: "Message text required", success: false });
        }

        // Find existing conversation or create a new one
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            });
        }

        // Create message
        const newMessage = await Message.create({
            sender: senderId,
            receiver: receiverId,
            message
        });

        conversation.messages.push(newMessage._id);
        await conversation.save();

        // Send real-time message via socket
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", {
                senderId,
                message,
                createdAt: newMessage.createdAt
            });
        }

        return res.status(201).json({
            message: "Message sent",
            success: true,
            newMessage
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

export const getMessages = async (req, res) => {
    try {
        const userId = req.id;
        const otherUserId = req.params.id;

        const conversation = await Conversation.findOne({
            participants: { $all: [userId, otherUserId] }
        }).populate({
            path: "messages",
            populate: {
                path: "sender",
                select: "username profilePicture"
            }
        });

        if (!conversation) {
            return res.status(200).json({ messages: [], success: true });
        }

        return res.status(200).json({
            success: true,
            messages: conversation.messages
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};
