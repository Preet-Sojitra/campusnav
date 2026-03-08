import { NextResponse } from "next/server";
import { getDirectionsUrl } from "@/lib/utd-map";

export async function GET(request) {
  const fromQuery = request.nextUrl.searchParams.get("from")?.trim();
  const toQuery = request.nextUrl.searchParams.get("to")?.trim();

  if (!fromQuery || !toQuery) {
    return NextResponse.json(
      { error: "Missing required query parameters: from, to" },
      { status: 400 },
    );
  }

  try {
    const url = await getDirectionsUrl(fromQuery, toQuery);
    if (!url) {
      return NextResponse.json(
        { error: "Could not resolve one or both rooms" },
        { status: 404 },
      );
    }
    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error("Failed to build directions URL:", error);
    return NextResponse.json(
      { error: "Failed to build directions URL" },
      { status: 500 },
    );
  }
}
``