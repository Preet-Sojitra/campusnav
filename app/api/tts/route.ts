import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Initialize the ElevenLabs client
const textToSpeech = new ElevenLabsClient({ apiKey: process.env.ELEVEN_LABS_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { text, type } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        // Mapping types to standard pre-made voices
        let voiceId = "JBFqnCBsd6RMkjVDRZzb"; // Default George
        if (type === "schedule") {
            voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel 
        } else if (type === "navigation") {
            voiceId = "pNInz6obpgDQGcFmaJgB"; // Adam
        } else if (type === "recommendation") {
            voiceId = "EXAVITQu4vr4xnSDxMaL"; // Bella
        }

        const audioStream = await textToSpeech.textToSpeech.convert(voiceId, {
            text: text,
            modelId: "eleven_monolingual_v1",
            voiceSettings: {
                stability: 0.5,
                similarityBoost: 0.75,
            }
        });

        // Convert Node.js readable stream to Web API ReadableStream
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of audioStream as any) {
                        controller.enqueue(chunk);
                    }
                } catch (error) {
                    controller.error(error);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-cache",
            },
        });
    } catch (error) {
        console.error("ElevenLabs TTS Error:", error);
        return NextResponse.json(
            { error: "Failed to generate speech" },
            { status: 500 }
        );
    }
}
