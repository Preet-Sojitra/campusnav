const CONCEPT3D_SEARCH_URL = "https://api.concept3d.com/search";
const CONCEPT3D_WAYFINDING_URL = "https://api.concept3d.com/wayfinding/v2";
const UTD_MAP_ID = "1772";

function normalizeRoomName(value) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function scoreCandidate(candidateName, query) {
  const normalizedCandidate = normalizeRoomName(candidateName);
  const normalizedQuery = normalizeRoomName(query);

  if (normalizedCandidate === normalizedQuery) {
    return 3;
  }

  if (normalizedCandidate.startsWith(normalizedQuery)) {
    return 2;
  }

  if (normalizedCandidate.includes(normalizedQuery)) {
    return 1;
  }

  return 0;
}

function pickBestCandidate(candidates, query) {
  if (candidates.length === 0) {
    return null;
  }

  const ranked = [...candidates].sort((a, b) => {
    const scoreA = scoreCandidate(a.name ?? "", query);
    const scoreB = scoreCandidate(b.name ?? "", query);
    return scoreB - scoreA;
  });

  return ranked[0] ?? null;
}

function toMapLocation(item) {
  if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) {
    return null;
  }

  const level =
    Array.isArray(item.level) && Number.isFinite(item.level[0])
      ? item.level[0]
      : 0;

  return {
    lat: item.lat,
    lng: item.lng,
    level,
    name: item.name,
  };
}

export async function getLocationByRoomName(roomQuery) {
  const trimmedQuery = roomQuery.trim();
  if (!trimmedQuery) {
    return null;
  }

  const apiKey = process.env.CONCEPT3D_KEY;
  if (!apiKey) {
    throw new Error("CONCEPT3D_KEY is not configured.");
  }

  const params = new URLSearchParams({
    map: UTD_MAP_ID,
    q: trimmedQuery,
    ppage: "5",
    key: apiKey,
  });

  const response = await fetch(`${CONCEPT3D_SEARCH_URL}?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Concept3D search failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const candidates = payload.data ?? [];

  const bestCandidate = pickBestCandidate(candidates, trimmedQuery);
  if (!bestCandidate) {
    return null;
  }

  return toMapLocation(bestCandidate);
}

const UTD_MAP_DIRECTIONS_BASE =
  "https://map.utdallas.edu/?id=1772#?d/type:walking;ada:false";

/**
 * Build a UTD map directions URL between two locations (from getLocationByRoomName).
 * @param from - { lat, lng, level, name? }
 * @param to - { lat, lng, level, name? }
 * @returns URL string to open on map.utdallas.edu
 */
export function buildDirectionsUrl(from, to) {
  const fromPart = `${from.lat},${from.lng},${from.level ?? 0}`;
  const toPart = `${to.lat},${to.lng},${to.level ?? 0}`;
  const startName = encodeURIComponent(from.name ?? "Start");
  const endName = encodeURIComponent(to.name ?? "End");
  return `${UTD_MAP_DIRECTIONS_BASE};from:${fromPart};to:${toPart};startName:${startName};endName:${endName}`;
}

/**
 * Get a UTD map directions URL from two room names (e.g. "ECSW 2.302", "SSB 2.300").
 * Resolves both via Concept3D and returns the map.utdallas.edu URL, or null if either room is not found.
 * @param startRoomName - e.g. "ecsw 2.302"
 * @param endRoomName - e.g. "ssb 2.300"
 * @returns Promise<string | null>
 */
export async function getDirectionsUrl(startRoomName, endRoomName) {
  const [fromLoc, toLoc] = await Promise.all([
    getLocationByRoomName(startRoomName),
    getLocationByRoomName(endRoomName),
  ]);
  if (!fromLoc || !toLoc) return null;
  return buildDirectionsUrl(fromLoc, toLoc);
}

/**
 * Parse a UTD directions URL built by buildDirectionsUrl/getDirectionsUrl.
 * @param directionsUrl
 * @returns {{ from: { lat: number, lng: number, level: number }, to: { lat: number, lng: number, level: number } } | null}
 */
export function parseDirectionsUrl(directionsUrl) {
  let parsed;
  try {
    parsed = new URL(directionsUrl);
  } catch {
    return null;
  }

  const hash = parsed.hash || "";
  const hashBody = hash.startsWith("#") ? hash.slice(1) : hash;

  const fromMatch = hashBody.match(
    /(?:^|;)from:([-0-9.]+),([-0-9.]+),([-0-9.]+)/,
  );
  const toMatch = hashBody.match(/(?:^|;)to:([-0-9.]+),([-0-9.]+),([-0-9.]+)/);
  if (!fromMatch || !toMatch) {
    return null;
  }

  const from = {
    lat: Number(fromMatch[1]),
    lng: Number(fromMatch[2]),
    level: Number(fromMatch[3]),
  };
  const to = {
    lat: Number(toMatch[1]),
    lng: Number(toMatch[2]),
    level: Number(toMatch[3]),
  };

  if (
    !Number.isFinite(from.lat) ||
    !Number.isFinite(from.lng) ||
    !Number.isFinite(from.level) ||
    !Number.isFinite(to.lat) ||
    !Number.isFinite(to.lng) ||
    !Number.isFinite(to.level)
  ) {
    return null;
  }

  return { from, to };
}

/**
 * Get walking duration + distance by calling Concept3D wayfinding with coordinates from a directions URL.
 * @param directionsUrl
 * @returns {Promise<{durationSeconds: number, formattedDuration: string, distance: number} | null>}
 */
export async function getDirectionsDuration(directionsUrl) {
  const parsed = parseDirectionsUrl(directionsUrl);
  if (!parsed) {
    return null;
  }

  const apiKey = process.env.CONCEPT3D_KEY;
  if (!apiKey) {
    throw new Error("CONCEPT3D_KEY is not configured.");
  }

  const { from, to } = parsed;
  const params = new URLSearchParams({
    map: UTD_MAP_ID,
    fromLat: String(from.lat),
    fromLng: String(from.lng),
    fromLevel: String(from.level),
    toLat: String(to.lat),
    toLng: String(to.lng),
    toLevel: String(to.level),
    currentLevel: String(to.level),
    mode: "walking",
    mapType: "mapboxgl",
    key: apiKey,
  });

  const response = await fetch(
    `${CONCEPT3D_WAYFINDING_URL}?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Concept3D wayfinding failed with status ${response.status}.`,
    );
  }

  const payload = await response.json();
  const route = payload?.routes?.[0];
  if (payload?.status !== "ok" || !route) {
    return null;
  }

  if (!Number.isFinite(route.duration) || !Number.isFinite(route.distance)) {
    return null;
  }

  return {
    durationSeconds: route.duration,
    formattedDuration:
      route.formattedDuration ?? `${Math.round(route.duration / 60)} Minutes`,
    distance: route.distance,
  };
}
