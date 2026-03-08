import { NextResponse } from "next/server";
import { getClosestEmptyRooms } from "@/lib/closest-empty-room";

function normalizeDay(day) {
  return String(day ?? "").trim().slice(0, 3).toUpperCase();
}

export async function GET(request) {
  const from = request.nextUrl.searchParams.get("from")?.trim();
  const to = request.nextUrl.searchParams.get("to")?.trim();
  const day = normalizeDay(request.nextUrl.searchParams.get("day"));
  const startTime = request.nextUrl.searchParams.get("startTime")?.trim();
  const referenceDateRaw = request.nextUrl.searchParams.get("referenceDate")?.trim();
  const limitRaw = request.nextUrl.searchParams.get("limit");

  if (!from || !to || !day || !startTime) {
    return NextResponse.json(
      {
        error:
          "Missing required query parameters: from, to, day, startTime",
      },
      { status: 400 },
    );
  }

  const options = {};
  if (referenceDateRaw) {
    const referenceDate = new Date(referenceDateRaw);
    if (Number.isNaN(referenceDate.getTime())) {
      return NextResponse.json(
        { error: "referenceDate must be a valid date string." },
        { status: 400 },
      );
    }
    options.referenceDate = referenceDate;
  }

  if (limitRaw !== null) {
    const parsedLimit = Number(limitRaw);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      return NextResponse.json(
        { error: "limit must be a positive number." },
        { status: 400 },
      );
    }
    options.limit = parsedLimit;
  }

  try {
    const rooms = await getClosestEmptyRooms(
      from,
      to,
      { day, startTime },
      options,
    );
    return NextResponse.json({ rooms }, { status: 200 });
  } catch (error) {
    console.error("Failed to get closest empty rooms:", error);
    return NextResponse.json(
      { error: "Failed to get closest empty rooms" },
      { status: 500 },
    );
  }
}
