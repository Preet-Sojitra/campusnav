import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getCourseName } from "@/lib/nebula";

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

        console.log("── File Upload ──");
        console.log("  Name:", file.name);
        console.log("  Type:", file.type);
        console.log("  Size:", `${(file.size / 1024).toFixed(1)} KB`);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString("base64");

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            // Enable JSON mode to prevent markdown backticks (```json) in the output
            config: {
                responseMimeType: "application/json",
            },
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `
Extract the class schedule from this image. This is a weekly calendar schedule showing classes across multiple days.

IMPORTANT: Extract EVERY class block from EVERY day column (MON, TUE, WED, THU, FRI). The same course often appears on multiple days (e.g. a class on both MON and WED). You MUST create a separate entry for EACH day it appears.

The text inside the colored blocks generally follows this pattern:
[Course Code] [Building] [Room]
[Instructors]

Return valid JSON in this exact format:
{
  "classes": [
    {
      "day": "THU",
      "courseCode": "SE-3341-004",
      "courseName": null,
      "startTime": "16:00",
      "room": "JO 3.516"
    }
  ]
}

Rules:
- There are NO course names in the image. Always set "courseName" to null.
- "courseCode" is the first hyphenated string (e.g., "CS-4390-004", "CS-1337-009").
- "room" is the combination of the building letters and numbers that come right after the course code (e.g., "ECSW 1.365", "GR 2.302", "JO 3.516").
- Use day values like MON, TUE, WED, THU, FRI.
- Use 24-hour HH:MM format for "startTime" based on the left-hand time grid.
- One object per class meeting block. If a class appears in 3 day columns, output 3 objects.
- Do NOT skip any days. Check every column in the calendar.
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

        const schedule = JSON.parse(text!);
        await Promise.all(
            schedule.classes.map(async (cls: any) => {
                // split the course code into prefix and number (ignore section like "004")
                const [prefix, number] = cls.courseCode.split("-");
                cls.courseName = await getCourseName(prefix, number);
            })
        );

        return NextResponse.json({
            success: true,
            fileName: file.name,
            schedule: schedule,
        });
    } catch (err) {
        console.error("Upload/parse error:", err);
        return NextResponse.json(
            { error: "Failed to parse schedule" },
            { status: 500 }
        );
    }
}