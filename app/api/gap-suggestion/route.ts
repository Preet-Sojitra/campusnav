import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(request: NextRequest) {
    try {
        const { gapMinutes, currentVirtualTime, syllabusText } = await request.json();

        if (!gapMinutes || !currentVirtualTime) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const dateObj = new Date(currentVirtualTime);
        const dateStr = dateObj.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
        });
        const timeStr = dateObj.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });

        // Hardcoded Semester Start Date (e.g., Jan 13, 2025 for Spring)
        const semesterStart = new Date("2026-01-20T00:00:00");
        const msPerWeek = 1000 * 60 * 60 * 24 * 7;
        const weeksSinceStart = Math.floor((dateObj.getTime() - semesterStart.getTime()) / msPerWeek) + 1;
        const currentWeekStr = weeksSinceStart > 0 ? `Week ${weeksSinceStart} of the semester` : "Before the semester starts";

        const prompt = `
You are an AI academic advisor for a university student.
The student has a gap of ${gapMinutes} minutes right now.
Today's simulated date is ${dateStr} (${currentWeekStr}), and the current time is ${timeStr}.

${syllabusText ? "Here is the syllabus text the student uploaded:\n" + syllabusText : "The student hasn't uploaded a syllabus."}

Based on the length of the gap (${gapMinutes} mins) and the current date, suggest 1 concrete thing the student should do right now. 
If a syllabus is provided, look at what topics or assignments might be relevant for this time of year and suggest reviewing a specific topic or starting an assignment.
If no syllabus is provided, suggest a general best-practice for their gap (e.g., getting a coffee, reviewing notes from the last class, or preparing for the next).

Crucially, as part of your suggestion, **ask a thought-provoking question, perhaps something that might help them in an interview or a design question** related to the topic at hand.

IMPORTANT: Return your response as 2 short sentences max. It should speak directly to the student and sound encouraging, natural, and friendly. It should be perfect for text-to-speech. Example: "Hi there! Since you have 45 minutes until your next class, I suggest reviewing Chapter 4 on data structures from your uploaded syllabus. Speaking of which, how would you design a thread-safe hash map?"
`;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                    ],
                },
            ],
        });

        const text = result.text;

        return NextResponse.json({
            success: true,
            suggestion: text,
        });

    } catch (err) {
        console.error("Gap suggestion error:", err);
        return NextResponse.json(
            { error: "Failed to generate suggestion" },
            { status: 500 }
        );
    }
}
