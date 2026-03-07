import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getCourseName } from "@/lib/nebula";

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
Extract all classes from this schedule image.

Return ONLY JSON:

{
  "classes": [
    {
      "day": "MON",
      "courseCode": "CS 3345",
      "courseName": "",
      "startTime": "13:00",
      "room": "GR 2.530"
    }
  ]
}

Rules:
- Only JSON
- HH:MM 24h
- day = MON TUE WED THU FRI SAT SUN
- keep courseCode even if name missing
- room "" if missing
`,
                        },
                        {
                            inlineData: {
                                mimeType: file.type || "image/jpeg",
                                data: base64Image,
                            },
                        },
                    ],
                },
            ],
            config: {
                responseMimeType: "application/json",
            },
        });

        const text = result.text;

        console.log("Raw Gemini:", text);

        if (!text) {
            throw new Error("No Gemini text");
        }

        let parsedJson: any;

        try {
            parsedJson = JSON.parse(text);
        } catch {
            const clean = text
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            parsedJson = JSON.parse(clean);
        }

        console.log("Parsed:", parsedJson);


        if (parsedJson?.classes && Array.isArray(parsedJson.classes)) {

            for (const c of parsedJson.classes) {

                if (c.courseCode) {

                    const match = c.courseCode.match(/^([A-Za-z]+)[\s-]*(\d+[A-Za-z]*)/);

                    if (match) {

                        const prefix = match[1].toUpperCase();
                        const number = match[2];

                        try {

                            const name = await getCourseName(prefix, number);

                            if (name) {
                                c.courseName = name;
                            }

                        } catch (err) {
                            console.log("Nebula failed:", err);
                        }

                    }
                }
            }
        }


        console.log("Final:", parsedJson);

        return NextResponse.json(parsedJson);

    } catch (err) {

        console.error(err);

        return NextResponse.json(
            {
                error: "parse failed",
                details: err instanceof Error ? err.message : String(err),
                stack: err instanceof Error ? err.stack : undefined
            },
            { status: 500 }
        );
    }
}