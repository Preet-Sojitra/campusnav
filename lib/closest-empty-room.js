import buildingLocations from "@/data/combinedDB.mapLocations.json";
import { getEventsForDate, getSchedulableRooms } from "@/lib/nebula-rooms";

const CHICAGO_TIMEZONE = "America/Chicago";
const DEFAULT_LIMIT = 5;

const DAY_INDEX = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

const BUILDING_COORDS = new Map();
const BUILDING_NAME_TO_ACRONYM = new Map();

for (const item of buildingLocations) {
  const acronym = normalizeText(item?.acronym).toUpperCase();
  const hasCoords = Number.isFinite(item?.lat) && Number.isFinite(item?.lng);
  if (acronym && hasCoords) {
    BUILDING_COORDS.set(acronym, { lat: item.lat, lng: item.lng });
  }

  const normalizedName = normalizeBuildingName(item?.name);
  if (normalizedName && acronym) {
    BUILDING_NAME_TO_ACRONYM.set(normalizedName, acronym);
  }
}

function normalizeText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeBuildingName(value) {
  const normalized = normalizeText(value).toUpperCase();
  return normalized.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

function canonicalizeBuilding(value) {
  const normalized = normalizeText(value).toUpperCase();
  if (!normalized) return "";

  if (BUILDING_COORDS.has(normalized)) {
    return normalized;
  }

  const parenMatch = normalized.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const fromParens = normalizeText(parenMatch[1]).toUpperCase();
    if (BUILDING_COORDS.has(fromParens)) {
      return fromParens;
    }
  }

  const normalizedName = normalizeBuildingName(normalized);
  if (BUILDING_NAME_TO_ACRONYM.has(normalizedName)) {
    return BUILDING_NAME_TO_ACRONYM.get(normalizedName);
  }

  return normalized;
}

function parseRoomInput(room) {
  const normalized = normalizeText(room).toUpperCase();
  if (!normalized) {
    return { building: "", room: "", floor: null, numeric: null };
  }

  const [buildingToken, ...rest] = normalized.split(" ");
  const roomToken = rest.join(" ").trim();
  const { floor, numeric } = parseRoomMetrics(roomToken);

  return {
    building: canonicalizeBuilding(buildingToken),
    room: roomToken,
    floor,
    numeric,
  };
}

function parseRoomMetrics(roomToken) {
  const normalized = normalizeText(roomToken);
  if (!normalized) {
    return { floor: null, numeric: null };
  }

  const floorMatch = normalized.match(/^(\d+)(?:[.\-][A-Z0-9]+)?$/);
  const floor = floorMatch ? Number(floorMatch[1]) : null;

  const digits = normalized.replace(/\D/g, "");
  const numeric = digits ? Number(digits) : null;

  return {
    floor: Number.isFinite(floor) ? floor : null,
    numeric: Number.isFinite(numeric) ? numeric : null,
  };
}

function parseTimeToMinutes(value) {
  const raw = normalizeText(value);
  if (!raw) return null;

  const upper = raw.toUpperCase();
  const hms = upper.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (hms) {
    let hours = Number(hms[1]);
    const minutes = Number(hms[2]);
    const period = hms[4];
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  const hm = upper.match(/^(\d{1,2})\s*(AM|PM)$/);
  if (hm) {
    let hours = Number(hm[1]);
    const period = hm[2];
    if (!Number.isFinite(hours)) return null;
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    if (hours < 0 || hours > 23) return null;
    return hours * 60;
  }

  return null;
}

function getChicagoDateParts(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";

  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  const weekdayText = get("weekday").slice(0, 3).toUpperCase();
  const weekdayIndex = DAY_INDEX[weekdayText];

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(weekdayIndex)
  ) {
    throw new Error("Failed to derive Chicago date parts.");
  }

  return { year, month, day, weekdayIndex };
}

function deriveDateAndMinutes(when, referenceDate) {
  const day = normalizeText(when?.day).slice(0, 3).toUpperCase();
  const targetDayIndex = DAY_INDEX[day];
  if (!Number.isFinite(targetDayIndex)) {
    throw new Error("Invalid day. Expected MON/TUE/WED/THU/FRI style value.");
  }

  const targetMinutes = parseTimeToMinutes(when?.startTime);
  if (!Number.isFinite(targetMinutes)) {
    throw new Error("Invalid startTime. Expected HH:MM in 24-hour format.");
  }

  const baseDate = referenceDate ? new Date(referenceDate) : new Date();
  if (Number.isNaN(baseDate.getTime())) {
    throw new Error("Invalid referenceDate.");
  }

  const { year, month, day: dom, weekdayIndex } = getChicagoDateParts(baseDate);
  const chicagoAsUtcDate = new Date(Date.UTC(year, month - 1, dom));

  // Week definition: Sunday -> Saturday.
  const delta = targetDayIndex - weekdayIndex;
  chicagoAsUtcDate.setUTCDate(chicagoAsUtcDate.getUTCDate() + delta);

  const isoDate = chicagoAsUtcDate.toISOString().slice(0, 10);
  return { isoDate, targetMinutes };
}

function makeRoomKey(building, roomToken) {
  return `${canonicalizeBuilding(building)}::${normalizeText(roomToken).toUpperCase()}`;
}

function eventOccupiesTime(event, targetMinutes) {
  const startMinutes = parseTimeToMinutes(
    event?.start_time ?? event?.startTime ?? event?.dateTimeStart,
  );
  const endMinutes = parseTimeToMinutes(
    event?.end_time ?? event?.endTime ?? event?.dateTimeEnd,
  );

  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
    return false;
  }

  return startMinutes <= targetMinutes && targetMinutes < endMinutes;
}

function buildOccupiedSet(eventsData, targetMinutes) {
  const occupied = new Set();

  for (const buildingEntry of eventsData) {
    const building = canonicalizeBuilding(buildingEntry?.building);
    if (!building || !Array.isArray(buildingEntry?.rooms)) {
      continue;
    }

    for (const roomEntry of buildingEntry.rooms) {
      const roomToken = normalizeText(roomEntry?.room);
      if (!roomToken || !Array.isArray(roomEntry?.events)) {
        continue;
      }

      if (roomEntry.events.some((event) => eventOccupiesTime(event, targetMinutes))) {
        occupied.add(makeRoomKey(building, roomToken));
      }
    }
  }

  return occupied;
}

function normalizeRoomTokenForBuilding(roomToken, building) {
  const normalized = normalizeText(roomToken).toUpperCase();
  const prefix = `${building} `;
  if (normalized.startsWith(prefix)) {
    return normalized.slice(prefix.length).trim();
  }
  return normalized;
}

function buildEmptyRooms(roomsData, occupiedSet) {
  const byBuilding = new Map();

  for (const buildingEntry of roomsData) {
    const building = canonicalizeBuilding(buildingEntry?.building);
    if (!building || !Array.isArray(buildingEntry?.rooms)) {
      continue;
    }

    for (const roomEntry of buildingEntry.rooms) {
      const rawRoomToken = normalizeText(roomEntry?.room);
      if (!rawRoomToken) {
        continue;
      }

      const normalizedToken = normalizeRoomTokenForBuilding(rawRoomToken, building);
      if (!normalizedToken) {
        continue;
      }

      if (occupiedSet.has(makeRoomKey(building, normalizedToken))) {
        continue;
      }

      const { floor, numeric } = parseRoomMetrics(normalizedToken);
      const candidate = {
        building,
        room: normalizedToken,
        fullRoom: `${building} ${normalizedToken}`,
        floor,
        numeric,
      };

      if (!byBuilding.has(building)) {
        byBuilding.set(building, []);
      }
      byBuilding.get(building).push(candidate);
    }
  }

  return byBuilding;
}

function compareWithinBuilding(a, b, sourceRoomInfo) {
  const sourceFloor = sourceRoomInfo?.floor;
  if (Number.isFinite(sourceFloor)) {
    const aSameFloor = a.floor === sourceFloor ? 0 : 1;
    const bSameFloor = b.floor === sourceFloor ? 0 : 1;
    if (aSameFloor !== bSameFloor) {
      return aSameFloor - bSameFloor;
    }

    const aFloorDiff = Number.isFinite(a.floor)
      ? Math.abs(a.floor - sourceFloor)
      : Number.MAX_SAFE_INTEGER;
    const bFloorDiff = Number.isFinite(b.floor)
      ? Math.abs(b.floor - sourceFloor)
      : Number.MAX_SAFE_INTEGER;
    if (aFloorDiff !== bFloorDiff) {
      return aFloorDiff - bFloorDiff;
    }
  }

  const sourceNumeric = sourceRoomInfo?.numeric;
  if (Number.isFinite(sourceNumeric)) {
    const aNumDiff = Number.isFinite(a.numeric)
      ? Math.abs(a.numeric - sourceNumeric)
      : Number.MAX_SAFE_INTEGER;
    const bNumDiff = Number.isFinite(b.numeric)
      ? Math.abs(b.numeric - sourceNumeric)
      : Number.MAX_SAFE_INTEGER;
    if (aNumDiff !== bNumDiff) {
      return aNumDiff - bNumDiff;
    }
  }

  return a.room.localeCompare(b.room);
}

function haversineDistanceMeters(from, to) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371e3;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getSortedOtherBuildings(originBuilding, byBuilding) {
  const buildings = [...byBuilding.keys()].filter((building) => building !== originBuilding);
  const originCoords = BUILDING_COORDS.get(originBuilding);

  if (!originCoords) {
    return buildings.sort((a, b) => a.localeCompare(b));
  }

  return buildings.sort((a, b) => {
    const coordsA = BUILDING_COORDS.get(a);
    const coordsB = BUILDING_COORDS.get(b);
    if (!coordsA && !coordsB) return a.localeCompare(b);
    if (!coordsA) return 1;
    if (!coordsB) return -1;
    return haversineDistanceMeters(originCoords, coordsA) -
      haversineDistanceMeters(originCoords, coordsB);
  });
}

function appendCandidates(results, seen, candidates, limit) {
  for (const candidate of candidates) {
    if (results.length >= limit) break;
    const dedupeKey = `${candidate.building}::${candidate.room}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    results.push({ room: candidate.fullRoom, building: candidate.building });
  }
}

export async function getClosestEmptyRooms(roomA, roomB, when, options = {}) {
  const limitRaw = Number(options?.limit ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0
    ? Math.min(Math.floor(limitRaw), 25)
    : DEFAULT_LIMIT;

  const fromRoom = parseRoomInput(roomA);
  const toRoom = parseRoomInput(roomB);
  if (!fromRoom.building || !toRoom.building) {
    throw new Error("Both roomA and roomB must include a building prefix.");
  }

  const { isoDate, targetMinutes } = deriveDateAndMinutes(when, options?.referenceDate);

  const [roomsData, eventsData] = await Promise.all([
    getSchedulableRooms(),
    getEventsForDate(isoDate),
  ]);

  const occupiedSet = buildOccupiedSet(eventsData, targetMinutes);
  const emptyRoomsByBuilding = buildEmptyRooms(roomsData, occupiedSet);

  const results = [];
  const seen = new Set();

  const fromBuildingRooms = [...(emptyRoomsByBuilding.get(fromRoom.building) ?? [])].sort(
    (a, b) => compareWithinBuilding(a, b, fromRoom),
  );
  const toBuildingRooms = [...(emptyRoomsByBuilding.get(toRoom.building) ?? [])].sort(
    (a, b) => compareWithinBuilding(a, b, toRoom),
  );

  appendCandidates(results, seen, fromBuildingRooms, limit);

  if (results.length < limit) {
    appendCandidates(results, seen, toBuildingRooms, limit);
  }

  if (results.length < limit) {
    const otherBuildings = getSortedOtherBuildings(fromRoom.building, emptyRoomsByBuilding)
      .filter((building) => building !== toRoom.building);

    const grouped = otherBuildings.map((building) => {
      const sorted = [...(emptyRoomsByBuilding.get(building) ?? [])].sort((a, b) =>
        compareWithinBuilding(a, b, fromRoom),
      );
      return sorted;
    });

    // Pass 1: prioritize spreading options across nearby buildings.
    for (const group of grouped) {
      if (results.length >= limit) break;
      if (group.length > 0) {
        appendCandidates(results, seen, [group[0]], limit);
      }
    }

    // Pass 2: fill remaining slots from closest buildings.
    for (const group of grouped) {
      if (results.length >= limit) break;
      if (group.length > 1) {
        appendCandidates(results, seen, group.slice(1), limit);
      }
    }
  }

  return results;
}
