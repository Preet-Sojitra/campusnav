import { NextResponse } from "next/server";
import { getDirectionsUrl } from "@/lib/utd-map";
import dbConnect from "@/lib/mongodb";
import MapCache from "@/models/MapCache";

export async function GET(request) {
  const fromQuery = request.nextUrl.searchParams.get("from")?.trim();
  const toQuery = request.nextUrl.searchParams.get("to")?.trim();

  if (!fromQuery || !toQuery) {
    return NextResponse.json(
      { error: "Missing required query parameters: from, to" },
      { status: 400 },
    );
  }

  const cacheKey = `dir:${fromQuery.toLowerCase()}:${toQuery.toLowerCase()}`;

  try {
    // Optional: use cache only when MongoDB is available (don't fail directions when DB is down)
    let cached = null;
    try {
      await dbConnect();
      cached = await MapCache.findOne({ cacheKey }).lean();
    } catch (_dbErr) {
      // MongoDB unreachable (e.g. ECONNREFUSED); continue without cache
    }

    if (cached) {
      console.log("⚡ Map Caching Hit for directions: ", cacheKey);
      return NextResponse.json(cached.routeData, { status: 200 });
    }

    // 2. Fetch from External Provider (Concept3D – no DB required)
    const url = await getDirectionsUrl(fromQuery, toQuery);
    if (!url) {
      return NextResponse.json(
        { error: "Could not resolve one or both rooms" },
        { status: 404 },
      );
    }

    const payload = { url };

    // 3. Save to Cache in background (best-effort; upsert avoids duplicate key errors)
    try {
      MapCache.findOneAndUpdate(
        { cacheKey },
        { cacheKey, routeData: payload },
        { upsert: true, new: true },
      ).catch((err) => console.error("Failed to save direction cache:", err));
    } catch (_) {}

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Failed to build directions URL:", error);
    return NextResponse.json(
      { error: "Failed to build directions URL" },
      { status: 500 },
    );
  }
}
