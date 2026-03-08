import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        console.log("── Syllabus Upload ──");
        console.log("  Name:", file.name);
        console.log("  Type:", file.type);
        console.log("  Size:", `${(file.size / 1024).toFixed(1)} KB`);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = buffer.toString("base64");

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `
Extract the detailed schedule, reading assignments, topics, and important notes from this syllabus. 
Format it cleanly as a text summary. Keep all dates, weeks, and topics intact.
If the document is not a syllabus, just extract whatever text is visible.
`,
                        },
                        {
                            inlineData: {
                                mimeType: file.type || "application/pdf",
                                data: base64Data,
                            },
                        },
                    ],
                },
            ],
        });

        const text = result.text;
        console.log("Syllabus extracted text length:", text?.length);

        return NextResponse.json({
            success: true,
            fileName: file.name,
            text: text,
        });
    } catch (err) {
        console.error("Syllabus parse error:", err);
        return NextResponse.json(
            { error: "Failed to parse syllabus" },
            { status: 500 }
        );
    }
}
