import { NextResponse } from "next/server";
import { getDirectionsDuration } from "@/lib/utd-map";
import dbConnect from "@/lib/mongodb";
import MapCache from "@/models/MapCache";

export async function GET(request) {
  const encodedUrl = request.nextUrl.searchParams.get("url");
  if (!encodedUrl) {
    return NextResponse.json(
      { error: "Missing required query parameter: url" },
      { status: 400 },
    );
  }

  const directionsUrl = decodeURIComponent(encodedUrl);
  // Hash the URL simply for the key to avoid crazy long _id keys in mongo
  const cacheKey = `dur:${Buffer.from(encodedUrl).toString('base64').slice(0, 100)}`;

  try {
    await dbConnect();

    // 1. Check Cache
    const cached = await MapCache.findOne({ cacheKey }).lean();
    if (cached) {
      console.log("⚡ Map Caching Hit for duration: ", cacheKey);
      return NextResponse.json(cached.routeData, { status: 200 });
    }

    // 2. Fetch from External Provider
    const durationData = await getDirectionsDuration(directionsUrl);
    if (!durationData) {
      return NextResponse.json(
        { error: "Could not parse URL or no route found" },
        { status: 404 },
      );
    }

    // 3. Save to Cache in background
    MapCache.create({ cacheKey, routeData: durationData }).catch(err => 
        console.error("Failed to save duration cache:", err)
    );

    return NextResponse.json(durationData, { status: 200 });
  } catch (error) {
    console.error("Failed to get directions duration:", error);
    return NextResponse.json(
      { error: "Failed to get directions duration" },
      { status: 500 },
    );
  }
}
