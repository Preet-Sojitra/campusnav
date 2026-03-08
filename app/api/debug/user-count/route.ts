import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
    try {
        await dbConnect();
        const count = await User.countDocuments({});
        return NextResponse.json({ count }, { status: 200 });
    } catch (error) {
        console.error("Error counting users:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}

