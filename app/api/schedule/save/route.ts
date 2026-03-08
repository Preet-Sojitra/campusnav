import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schedule } = await req.json();

    if (!Array.isArray(schedule)) {
      return NextResponse.json({ error: "Invalid schedule format" }, { status: 400 });
    }

    await dbConnect();

    await User.findOneAndUpdate(
      { email: session.user.email },
      { savedSchedule: schedule }
    );

    return NextResponse.json({ message: "Schedule saved successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to save schedule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
