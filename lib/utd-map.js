const CONCEPT3D_SEARCH_URL = "https://api.concept3d.com/search";
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

  const level = Array.isArray(item.level) && Number.isFinite(item.level[0]) ? item.level[0] : 0;

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
