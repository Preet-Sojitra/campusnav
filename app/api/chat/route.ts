import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { message, context } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const baseInstruction = `You are Gemini, a helpful AI academic advisor for a college student. You help them organize their schedule and review course materials.
When the student asks what they should do in their free time or gaps, DO NOT just list the physical locations from their schedule gaps. Instead, look at their uploaded syllabus context, figure out what week of the semester it is, and suggest specific topics they should study, assignments they should start, or provide a thought-provoking interview/design question related to their current materials.
Keep your responses concise, friendly, and formatted nicely in Markdown.`;
        const fullInstruction = context ? `${baseInstruction}\n\nUser's Current Context:\n${context}` : baseInstruction;

        const responseStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: message,
            config: {
                systemInstruction: fullInstruction,
            }
        });

        // Create a streaming response
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of responseStream) {
                        const chunkText = chunk.text;
                        if (chunkText) {
                            controller.enqueue(encoder.encode(chunkText));
                        }
                    }
                } catch (error) {
                    console.error("Stream error:", error);
                    controller.error(error);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        console.error("Error in chat API:", error);
        return NextResponse.json(
            { error: "Failed to process chat message" },
            { status: 500 }
        );
    }
}
