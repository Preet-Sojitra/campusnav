import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Chat from "@/models/Chat";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Fetch last 50 messages for the demo session, sorted oldest to newest
        const history = await Chat.find({ sessionId: "anonymous-demo" })
            .sort({ createdAt: 1 })
            .limit(50)
            .lean();

        // Map to match the frontend Message type format
        const formatted = history.map((msg: any) => ({
            id: msg._id.toString(),
            role: msg.role,
            content: msg.content,
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Failed to fetch chat history:", error);
        return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { role, content } = await req.json();

        if (!role || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newMessage = await Chat.create({
            role,
            content,
            sessionId: "anonymous-demo" // For the hackathon MVP, everyone shares one session or it just works per browser
        });

        return NextResponse.json({ success: true, message: newMessage });
    } catch (error) {
        console.error("Failed to save message:", error);
        return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }
}
