import { NextResponse } from "next/server";
import { getDirectionsDuration } from "@/lib/utd-map";

export async function GET(request) {
  const encodedUrl = request.nextUrl.searchParams.get("url");
  if (!encodedUrl) {
    return NextResponse.json(
      { error: "Missing required query parameter: url" },
      { status: 400 },
    );
  }

  const directionsUrl = decodeURIComponent(encodedUrl);

  try {
    const durationData = await getDirectionsDuration(directionsUrl);
    if (!durationData) {
      return NextResponse.json(
        { error: "Could not parse URL or no route found" },
        { status: 404 },
      );
    }

    return NextResponse.json(durationData, { status: 200 });
  } catch (error) {
    console.error("Failed to get directions duration:", error);
    return NextResponse.json(
      { error: "Failed to get directions duration" },
      { status: 500 },
    );
  }
}
