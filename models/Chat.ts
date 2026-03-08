import mongoose, { Schema, Document } from "mongoose";

export interface IChat extends Document {
    role: "user" | "assistant";
    content: string;
    createdAt: Date;
    sessionId?: string; // Optional: To group chats by session/user if they had accounts
}

const ChatSchema = new Schema<IChat>(
    {
        role: {
            type: String,
            required: true,
            enum: ["user", "assistant"],
        },
        content: {
            type: String,
            required: true,
        },
        sessionId: {
            type: String,
            required: false,
            default: "anonymous-demo"
        }
    },
    { timestamps: true }
);

export default mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);
