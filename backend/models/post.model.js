import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    caption: { type: String },

    // Image URL (optional for text posts)
    image: { type: String },

    // Tweet text (optional for image posts)
    text: { type: String, maxlength: 280 },

    // Type of post
    type: { type: String, enum: ["image", "text"], required: true },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    likes: [
        { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],

    comments: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Comment" }
    ]

}, { timestamps: true });

export const Post = mongoose.model("Post", postSchema);
