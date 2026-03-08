const NEBULA_API_BASE_URL = "https://api.utdnebula.com";

function getNebulaHeaders() {
  const apiKey = process.env.NEBULA_API_KEY?.trim();
  const headers = {
    Accept: "application/json",
  };

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  return headers;
}

async function fetchNebula(pathname) {
  const response = await fetch(`${NEBULA_API_BASE_URL}${pathname}`, {
    method: "GET",
    headers: getNebulaHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Nebula API request failed with status ${response.status}.`);
  }

  return response.json();
}

export async function getSchedulableRooms() {
  const payload = await fetchNebula("/rooms");
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function getEventsForDate(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new Error("isoDate must be in YYYY-MM-DD format.");
  }

  const payload = await fetchNebula(`/events/${encodeURIComponent(isoDate)}`);
  return Array.isArray(payload?.data) ? payload.data : [];
}
