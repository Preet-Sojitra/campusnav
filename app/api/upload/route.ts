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

        // Log the file details
        console.log("── File Upload ──");
        console.log("  Name:", file.name);
        console.log("  Type:", file.type);
        console.log("  Size:", `${(file.size / 1024).toFixed(1)} KB`);

        // Convert file to base64 for Gemini
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString("base64");

        // Parse schedule with Gemini
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `
Extract the class schedule from this image.

Return ONLY valid JSON in this exact format:
{
  "classes": [
    {
      "day": "THU",
      "courseCode": "SE 3341",
      "courseName": "Lecture",
      "startTime": "08:30",
      "room": "JO 3.601"
    }
  ]
}

Rules:
- Use day values like MON, TUE, WED, THU, FRI
- Use 24-hour HH:MM format
- Return only JSON
- One object per class meeting
`,
                        },
                        {
                            inlineData: {
                                mimeType: file.type,
                                data: base64Image,
                            },
                        },
                    ],
                },
            ],
        });

        const text = result.text;
        console.log("Gemini result:", text);

        return NextResponse.json({
            success: true,
            fileName: file.name,
            schedule: text,
        });
    } catch (err) {
        console.error("Upload/parse error:", err);
        return NextResponse.json(
            { error: "Failed to parse schedule" },
            { status: 500 }
        );
    }
}
