import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("image");

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { error: "No image uploaded" },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString("base64");

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
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
            message: text,
        });
    } catch (err) {
        console.error(err);

        return NextResponse.json(
            { error: "Gemini failed" },
            { status: 500 }
        );
    }
}