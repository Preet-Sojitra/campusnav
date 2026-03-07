import { NextResponse } from "next/server";
import { getLocationByRoomName } from "@/lib/utd-map";

export async function GET(request) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "Missing required query parameter: q" },
      { status: 400 },
    );
  }

  try {
    const location = await getLocationByRoomName(query);
    return NextResponse.json(location, { status: 200 });
  } catch (error) {
    console.error("Failed to resolve classroom location:", error);
    return NextResponse.json(
      { error: "Failed to resolve classroom location" },
      { status: 500 },
    );
  }
}
