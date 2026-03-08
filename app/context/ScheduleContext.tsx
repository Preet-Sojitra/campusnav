"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export interface ClassEntry {
  day: string;
  courseCode: string;
  courseName: string;
  startTime: string;
  room: string;
}

export interface RouteEntry {
  from: ClassEntry;
  to: ClassEntry;
  directionsUrl: string | null;
  formattedDuration: string | null;

  freeRoomDirectionsUrl?: string | null;
  freeRoomFormattedDuration?: string | null;
  nextClassDirectionsUrl?: string | null;
  nextClassFormattedDuration?: string | null;
  freeRoomSuggestion?: {
    status: string;
    message: string;
    usableMinutes: number;
    leaveAt: string;
  } | null;

  loading: boolean;
  error: string | null;
}

export interface BestRoomEntry {
  room: string;
  toRoom?: {
    durationSeconds: number;
    formattedDuration: string;
    distance: number;
  } | null;
  toNext?: {
    durationSeconds: number;
    formattedDuration: string;
    distance: number;
  } | null;
  warning?: {
    status: string;
    walkToRoomMin: number;
    walkToNextClassMin: number;
    usableMinutes: number;
    leaveAt: string;
    message: string;
  } | null;
}

interface ScheduleState {
  classes: ClassEntry[];
  routes: RouteEntry[];
  bestRoom: BestRoomEntry | null;
  isLoading: boolean;
  error: string | null;
  uploadFile: (file: File) => void;
}

const ScheduleContext = createContext<ScheduleState | null>(null);

function computeConsecutivePairs(
  classes: ClassEntry[],
): [ClassEntry, ClassEntry][] {
  const byDay: Record<string, ClassEntry[]> = {};
  for (const c of classes) {
    const day = c.day.toUpperCase();
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(c);
  }

  const pairs: [ClassEntry, ClassEntry][] = [];
  for (const day of Object.keys(byDay)) {
    const sorted = byDay[day].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      pairs.push([sorted[i], sorted[i + 1]]);
    }
  }
  return pairs;
}

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [routes, setRoutes] = useState<RouteEntry[]>([]);
  const [bestRoom, setBestRoom] = useState<BestRoomEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (classes.length < 2) {
      setRoutes([]);
      return;
    }

    const pairs = computeConsecutivePairs(classes);
    if (pairs.length === 0) {
      setRoutes([]);
      return;
    }

    const initial: RouteEntry[] = pairs.map(([from, to]) => ({
      from,
      to,
      directionsUrl: null,
      formattedDuration: null,
      freeRoomDirectionsUrl: null,
      freeRoomFormattedDuration: null,
      nextClassDirectionsUrl: null,
      nextClassFormattedDuration: null,
      freeRoomSuggestion: null,
      loading: true,
      error: null,
    }));
    setRoutes(initial);

    pairs.forEach(([from, to], idx) => {
      const HARDCODED_FREE_ROOM = "Library";

      async function resolveRoute() {
        // 1. Direct route
        const params = new URLSearchParams({ from: from.room, to: to.room });
        const res = await fetch(`/api/map/directions?${params.toString()}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        const data = await res.json();

        let directionsUrl = data.url ?? null;
        let formattedDuration: string | null = null;
        if (directionsUrl) {
          try {
            const durRes = await fetch(
              `/api/map/directions/duration?url=${encodeURIComponent(directionsUrl)}`,
            );
            if (durRes.ok) {
              const durData = await durRes.json();
              formattedDuration = durData.formattedDuration ?? null;
            }
          } catch {}
        }

        // 2. Free Room route (from -> free room)
        let freeRoomDirectionsUrl: string | null = null;
        let freeRoomFormattedDuration: string | null = null;
        let freeRoomDurationSeconds: number | null = null;

        try {
          const frParams = new URLSearchParams({
            from: from.room,
            to: HARDCODED_FREE_ROOM,
          });
          const frRes = await fetch(
            `/api/map/directions?${frParams.toString()}`,
          );
          if (frRes.ok) {
            const frData = await frRes.json();
            freeRoomDirectionsUrl = frData.url ?? null;
            if (freeRoomDirectionsUrl) {
              const frDurRes = await fetch(
                `/api/map/directions/duration?url=${encodeURIComponent(freeRoomDirectionsUrl)}`,
              );
              if (frDurRes.ok) {
                const frDurData = await frDurRes.json();
                freeRoomFormattedDuration = frDurData.formattedDuration ?? null;
                freeRoomDurationSeconds = frDurData.durationSeconds ?? null;
              }
            }
          }
        } catch {}

        // 3. Free Room route (free room -> to)
        let nextClassDirectionsUrl: string | null = null;
        let nextClassFormattedDuration: string | null = null;
        let nextClassDurationSeconds: number | null = null;

        try {
          const ncParams = new URLSearchParams({
            from: HARDCODED_FREE_ROOM,
            to: to.room,
          });
          const ncRes = await fetch(
            `/api/map/directions?${ncParams.toString()}`,
          );
          if (ncRes.ok) {
            const ncData = await ncRes.json();
            nextClassDirectionsUrl = ncData.url ?? null;
            if (nextClassDirectionsUrl) {
              const ncDurRes = await fetch(
                `/api/map/directions/duration?url=${encodeURIComponent(nextClassDirectionsUrl)}`,
              );
              if (ncDurRes.ok) {
                const ncDurData = await ncDurRes.json();
                nextClassFormattedDuration =
                  ncDurData.formattedDuration ?? null;
                nextClassDurationSeconds = ncDurData.durationSeconds ?? null;
              }
            }
          }
        } catch {}

        // 4. Calculate suggestion with gap
        let freeRoomSuggestion = null;
        function parseTimeMin(t: string) {
          const m = t.match(/(\d+):(\d+)\s*(am|pm)?/i);
          if (!m) return 0;
          let h = parseInt(m[1]);
          const min = parseInt(m[2]);
          const ampm = m[3]?.toLowerCase();
          if (ampm === "pm" && h < 12) h += 12;
          if (ampm === "am" && h === 12) h = 0;
          return h * 60 + min;
        }
        function formatTime(min: number) {
          const safe = Math.max(0, min);
          let h = Math.floor(safe / 60) % 24;
          const m = safe % 60;
          const ampm = h >= 12 ? "PM" : "AM";
          h = h % 12;
          if (h === 0) h = 12;
          return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
        }

        if (
          freeRoomDurationSeconds !== null &&
          nextClassDurationSeconds !== null
        ) {
          const fromMin = parseTimeMin(from.startTime);
          const toMin = parseTimeMin(to.startTime);
          const gapMin = toMin - (fromMin + 75); // User said 75min

          if (gapMin > 0) {
            const w1 = Math.ceil(freeRoomDurationSeconds / 60);
            const w2 = Math.ceil(nextClassDurationSeconds / 60);
            const usable = gapMin - w1 - w2;
            const leaveAt = formatTime(toMin - w2);

            if (usable <= 0) {
              freeRoomSuggestion = {
                status: "not_recommended",
                message: "Library is too far to use before next class.",
                usableMinutes: 0,
                leaveAt,
              };
            } else if (usable < 10) {
              freeRoomSuggestion = {
                status: "tight",
                message: `Library (Tight): Stay ${usable} min. Leave by ${leaveAt}.`,
                usableMinutes: usable,
                leaveAt,
              };
            } else {
              freeRoomSuggestion = {
                status: "good",
                message: `Library (Good): Stay ${usable} min. Leave by ${leaveAt}.`,
                usableMinutes: usable,
                leaveAt,
              };
            }
          } else {
            freeRoomSuggestion = {
              status: "not_recommended",
              message: "No time between classes.",
              usableMinutes: 0,
              leaveAt: formatTime(toMin),
            };
          }
        }

        setRoutes((prev) =>
          prev.map((r, i) =>
            i === idx
              ? {
                  ...r,
                  directionsUrl,
                  formattedDuration,
                  freeRoomDirectionsUrl,
                  freeRoomFormattedDuration,
                  nextClassDirectionsUrl,
                  nextClassFormattedDuration,
                  freeRoomSuggestion,
                  loading: false,
                }
              : r,
          ),
        );
      }

      resolveRoute().catch((err) => {
        setRoutes((prev) =>
          prev.map((r, i) =>
            i === idx ? { ...r, loading: false, error: err.message } : r,
          ),
        );
      });
    });
  }, [classes]);

  const uploadFile = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);
    setClasses([]);
    setRoutes([]);
    setBestRoom(null);

    const formData = new FormData();
    formData.append("file", file);

    fetch("/api/upload", { method: "POST", body: formData })
      .then(async (res) => {
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();

        console.log("UPLOAD RESPONSE:", data);
        setBestRoom(data.bestRoom ?? null);

        let parsed = data.schedule;
        if (typeof parsed === "string") {
          parsed = parsed
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();
          parsed = JSON.parse(parsed);
        }

        setClasses(parsed.classes ?? []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Schedule parse error:", err);
        setError("Failed to parse schedule. Please try again.");
        setIsLoading(false);
      });
  }, []);

  return (
    <ScheduleContext.Provider
      value={{ classes, routes, bestRoom, isLoading, error, uploadFile }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used within ScheduleProvider");
  return ctx;
}
