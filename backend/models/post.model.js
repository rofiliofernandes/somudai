import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    caption: { type: String },
    image:   { type: String, required: true },

    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }]
}, { timestamps: true });

text: { type: String, maxlength: 280 }, // tweet
type: { type: String, enum: ["image", "text"], required: true },


export const Post = mongoose.model("Post", postSchema);

