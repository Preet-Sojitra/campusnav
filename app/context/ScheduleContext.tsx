"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    type ReactNode,
} from "react";
import type {
    ScheduleClass,
    WalkingSegment,
    ScheduleGap,
    EmptyRoom,
} from "@/lib/types";
import { useSession } from "next-auth/react";

/* ------------------------------------------------------------------ */
/*  Raw API types (from Gemini parse)                                  */
/* ------------------------------------------------------------------ */

interface RawClassEntry {
    day: string;
    courseCode: string;
    courseName: string | null;
    startTime: string; // "16:00" 24-hr
    room: string;
}

interface RouteResult {
    directionsUrl: string | null;
    formattedDuration: string | null;
    durationSeconds: number | null;
}

/* ------------------------------------------------------------------ */
/*  Context shape                                                      */
/* ------------------------------------------------------------------ */

interface ScheduleState {
    /** ALL raw classes grouped by day */
    allClassesByDay: Record<string, ScheduleClass[]>;
    /** Available day codes (e.g. ["MON","TUE","WED"]) */
    availableDays: string[];
    /** Currently selected day code */
    selectedDay: string;
    /** Filtered classes for the selected day */
    classes: ScheduleClass[];
    /** Walking segments for selected day */
    walkingSegments: WalkingSegment[];
    /** Detected gaps for selected day */
    gaps: ScheduleGap[];
    /** Whether the upload + parse pipeline is running */
    isLoading: boolean;
    /** Error message, if any */
    error: string | null;
    /** Whether we have real data (vs demo) */
    hasRealData: boolean;
    /** Trigger the upload flow */
    uploadFile: (file: File) => void;
    /** Switch to a different day */
    setSelectedDay: (day: string) => void;
    /** Clear schedule data entirely */
    clearSchedule: () => void;
}

const ScheduleContext = createContext<ScheduleState | null>(null);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Convert 24-hr "HH:MM" → 12-hr "H:MM AM/PM" */
function to12Hour(time24: string): string {
    const [hStr, mStr] = time24.split(":");
    let h = Number.parseInt(hStr, 10);
    const m = mStr.padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${m} ${ampm}`;
}

/** Parse "HH:MM" 24-hr string into minutes since midnight */
function toMinutes(time24: string): number {
    const [h, m] = time24.split(":").map(Number);
    return h * 60 + m;
}

/** Convert minutes since midnight back to "HH:MM" 24-hr */
function fromMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** Estimate class end time as startTime + 75 min (standard UTD class length) */
function estimateEndTime(startTime24: string): string {
    const startMin = toMinutes(startTime24);
    return fromMinutes(startMin + 75);
}

/** Format a duration in minutes to a readable string */
function formatGapDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const JS_DAY_TO_CODE: Record<number, string> = {
    0: "SUN", 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT",
};

/** Pick the best default day: today if classes exist, else next day with classes */
function pickDefaultDay(availableDays: string[]): string {
    if (availableDays.length === 0) return "MON";

    const todayCode = JS_DAY_TO_CODE[new Date().getDay()];
    if (availableDays.includes(todayCode)) return todayCode;

    // Find next available day after today
    const todayIdx = DAY_ORDER.indexOf(todayCode);
    for (let offset = 1; offset <= 7; offset++) {
        const candidate = DAY_ORDER[(todayIdx + offset) % 7];
        if (availableDays.includes(candidate)) return candidate;
    }

    return availableDays[0];
}

/** Resolve directions URL + duration for a room pair */
export async function resolveRoute(
    fromRoom: string,
    toRoom: string,
): Promise<RouteResult> {
    try {
        const dirParams = new URLSearchParams({ from: fromRoom, to: toRoom });
        const dirRes = await fetch(`/api/map/directions?${dirParams.toString()}`);
        if (!dirRes.ok) return { directionsUrl: null, formattedDuration: null, durationSeconds: null };
        const dirData = await dirRes.json();
        const url: string | null = dirData.url ?? null;

        let formattedDuration: string | null = null;
        let durationSeconds: number | null = null;

        if (url) {
            try {
                const durRes = await fetch(
                    `/api/map/directions/duration?url=${encodeURIComponent(url)}`,
                );
                if (durRes.ok) {
                    const durData = await durRes.json();
                    formattedDuration = durData.formattedDuration ?? null;
                    durationSeconds = durData.durationSeconds ?? null;
                }
            } catch {
                /* duration is optional */
            }
        }

        return { directionsUrl: url, formattedDuration, durationSeconds };
    } catch {
        return { directionsUrl: null, formattedDuration: null, durationSeconds: null };
    }
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

const GAP_THRESHOLD_MINUTES = 45;

const SUGGESTED_SPOTS = [
    { name: "McDermott Library, 3rd Floor", badge: "QUIET SPOT SUGGESTED", walkTime: "2 min", amenity: "Power outlets" },
    { name: "ECSW Student Lounge", badge: "POPULAR STUDY SPOT", walkTime: "3 min", amenity: "High-speed Wifi" },
    { name: "Student Union, 2nd Floor", badge: "CAFÉ & STUDY", walkTime: "5 min", amenity: "Cafe nearby" },
];

const CACHE_KEY = "nebulalearn-schedule-cache";

export function ScheduleProvider({ children, isDashboardActive = false }: { children: ReactNode; isDashboardActive?: boolean }) {
    const [rawClasses, setRawClasses] = useState<RawClassEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasRealData, setHasRealData] = useState(false);
    const [selectedDay, setSelectedDay] = useState("MON");

    // Route cache: "fromRoom->toRoom" -> RouteResult
    const [routeCache, setRouteCache] = useState<Record<string, RouteResult>>({});

    const { status } = useSession();

    /* ── Fetch schedule from server if authenticated ── */
    useEffect(() => {
        if (status === "authenticated") {
            fetch("/api/schedule/get")
                .then((res) => res.json())
                .then((data) => {
                    if (data.schedule && data.schedule.length > 0) {
                        setRawClasses(data.schedule);
                        setHasRealData(true);
                        try {
                            localStorage.setItem(CACHE_KEY, JSON.stringify(data.schedule));
                        } catch {
                            // ignore
                        }
                    }
                })
                .catch(console.error);
        }
    }, [status]);

    /* ── Load cached schedule on mount ── */
    useEffect(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached) as RawClassEntry[];
                if (Array.isArray(parsed) && parsed.length > 0) {
                    console.log(`Loaded ${parsed.length} cached classes`);
                    setRawClasses(parsed);
                    setHasRealData(true);
                }
            }
        } catch {
            // Ignore corrupted cache
        }
    }, []);

    /* ── Group raw classes by day ── */
    const classesByDay = useMemo(() => {
        const byDay: Record<string, RawClassEntry[]> = {};
        for (const c of rawClasses) {
            const d = c.day.toUpperCase();
            if (!byDay[d]) byDay[d] = [];
            byDay[d].push(c);
        }
        // Sort each day by start time
        for (const d of Object.keys(byDay)) {
            byDay[d].sort((a, b) => a.startTime.localeCompare(b.startTime));
        }
        return byDay;
    }, [rawClasses]);

    const availableDays = useMemo(
        () => DAY_ORDER.filter((d) => classesByDay[d]?.length),
        [classesByDay],
    );

    // Auto-select best day when data arrives
    useEffect(() => {
        if (availableDays.length > 0) {
            setSelectedDay(pickDefaultDay(availableDays));
        }
    }, [availableDays]);

    /* ── Convert selected day's raw classes → UI types ── */
    const dayRawClasses = useMemo(
        () => classesByDay[selectedDay] ?? [],
        [classesByDay, selectedDay],
    );

    // Build ScheduleClass[] for the selected day
    const [classes, setClasses] = useState<ScheduleClass[]>([]);
    const [walkingSegments, setWalkingSegments] = useState<WalkingSegment[]>([]);

    useEffect(() => {
        const uiClasses: ScheduleClass[] = dayRawClasses.map((c, i) => ({
            id: `${c.courseCode}-${selectedDay}-${i}`,
            status: "upcoming" as const,
            courseCode: c.courseCode.replace(/-/g, " ").replace(/ \d{3}$/, ""),
            courseName: c.courseName || c.courseCode.split("-").slice(0, 2).join(" "),
            startTime: to12Hour(c.startTime),
            endTime: to12Hour(estimateEndTime(c.startTime)),
            location: c.room,
        }));
        setClasses(uiClasses);

        // Build initial walking segments (no directionsUrl yet)
        const initialSegs: WalkingSegment[] = [];
        for (let i = 0; i < dayRawClasses.length - 1; i++) {
            const currentEnd = toMinutes(estimateEndTime(dayRawClasses[i].startTime));
            const nextStart = toMinutes(dayRawClasses[i + 1].startTime);
            const gapMinutes = nextStart - currentEnd;
            if (gapMinutes > 0) {
                initialSegs.push({ duration: `${Math.min(gapMinutes, 15)} min walk to next class` });
            } else {
                initialSegs.push({ duration: "Back-to-back classes" });
            }
        }
        setWalkingSegments(initialSegs);

        // Resolve routes for consecutive pairs (ONLY IF ON DASHBOARD)
        if (isDashboardActive) {
            dayRawClasses.forEach((c, i) => {
                if (i >= dayRawClasses.length - 1) return;
                const next = dayRawClasses[i + 1];
                const cacheKey = `${c.room}->${next.room}`;

                // Check cache first
                if (routeCache[cacheKey]) {
                    const route = routeCache[cacheKey];
                    applyRoute(i, c, next, route);
                    return;
                }

                resolveRoute(c.room, next.room).then((route) => {
                    setRouteCache((prev) => ({ ...prev, [cacheKey]: route }));
                    applyRoute(i, c, next, route);
                });
            });
        }

        function applyRoute(i: number, c: RawClassEntry, next: RawClassEntry, route: RouteResult, overrideWalkSeconds?: number) {
            // Update class with directions + leave-by time
            setClasses((prev) =>
                prev.map((cls, idx) => {
                    if (idx !== i) return cls;
                    let leaveByTime: string | null = null;
                    const walkSecondsToUse = overrideWalkSeconds ?? route.durationSeconds;

                    if (walkSecondsToUse) {
                        const walkMin = Math.ceil(walkSecondsToUse / 60);
                        const nextStartMin = toMinutes(next.startTime);
                        const leaveMin = nextStartMin - walkMin;
                        const endMin = toMinutes(estimateEndTime(c.startTime));

                        // If we used an override (i.e. empty room), we don't necessarily need to leave 
                        // before the next class starts. We just want to suggest leaving right after class
                        // or provide a walk time. Right now we use the max of 'leave before next class' or 'end of this class'.
                        leaveByTime = to12Hour(fromMinutes(Math.max(leaveMin, endMin - 10)));
                    }
                    return {
                        ...cls,
                        directionsUrl: route.directionsUrl,
                        walkDurationSeconds: walkSecondsToUse,
                        leaveByTime,
                    };
                }),
            );

            // Update walking segment with real duration and directions URL
            setWalkingSegments((prev) =>
                prev.map((seg, idx) => {
                    if (idx !== i) return seg;
                    return {
                        ...seg,
                        duration: route.formattedDuration
                            ? `${route.formattedDuration} walk to next class`
                            : seg.duration,
                        directionsUrl: route.directionsUrl,
                    };
                }),
            );
        }
    }, [dayRawClasses, selectedDay, isDashboardActive]);

    /* ── Compute gaps for selected day ── */
    const gaps = useMemo(() => {
        const detectedGaps: ScheduleGap[] = [];

        for (let i = 0; i < dayRawClasses.length - 1; i++) {
            const currentEnd = toMinutes(estimateEndTime(dayRawClasses[i].startTime));
            const nextStart = toMinutes(dayRawClasses[i + 1].startTime);
            const gapMinutes = nextStart - currentEnd;

            if (gapMinutes >= GAP_THRESHOLD_MINUTES) {
                const spotIndex = detectedGaps.length % SUGGESTED_SPOTS.length;
                detectedGaps.push({
                    duration: formatGapDuration(gapMinutes),
                    durationMinutes: gapMinutes,
                    message: "Maximize your time between classes",
                    suggestedSpot: SUGGESTED_SPOTS[spotIndex],
                });
            }
        }

        return detectedGaps;
    }, [dayRawClasses]);

    /* ── Build allClassesByDay for the calendar ── */
    const allClassesByDay = useMemo(() => {
        const result: Record<string, ScheduleClass[]> = {};
        for (const [day, rawList] of Object.entries(classesByDay)) {
            result[day] = rawList.map((c, i) => ({
                id: `${c.courseCode}-${day}-${i}`,
                status: "upcoming" as const,
                courseCode: c.courseCode.replace(/-/g, " ").replace(/ \d{3}$/, ""),
                courseName: c.courseName || c.courseCode.split("-").slice(0, 2).join(" "),
                startTime: to12Hour(c.startTime),
                endTime: to12Hour(estimateEndTime(c.startTime)),
                location: c.room,
            }));
        }
        return result;
    }, [classesByDay]);

    /* ── Clear handler ── */
    const clearSchedule = useCallback(() => {
        setRawClasses([]);
        setHasRealData(false);
        setRouteCache({});
        try {
            localStorage.removeItem(CACHE_KEY);
        } catch {
            // ignore
        }
    }, []);

    /* ── Upload handler ── */
    const uploadFile = useCallback((file: File) => {
        setIsLoading(true);
        setError(null);
        setRawClasses([]);
        setHasRealData(false);
        setRouteCache({});

        const formData = new FormData();
        formData.append("file", file);

        fetch("/api/upload", { method: "POST", body: formData })
            .then(async (res) => {
                if (!res.ok) throw new Error("Upload failed");
                const data = await res.json();

                let parsed = data.schedule;
                if (typeof parsed === "string") {
                    parsed = parsed
                        .replace(/```json\n?/g, "")
                        .replace(/```\n?/g, "")
                        .trim();
                    parsed = JSON.parse(parsed);
                }

                const classes = parsed.classes ?? [];
                setRawClasses(classes);
                setHasRealData(true);
                setIsLoading(false);

                // If user is authenticated, save it to the DB
                if (status === "authenticated") {
                    try {
                        await fetch("/api/schedule/save", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ schedule: classes }),
                        });
                        console.log("Saved schedule to DB");
                    } catch (dbErr) {
                        console.error("Failed to save schedule to DB", dbErr);
                    }
                }

                // Cache to localStorage so we don't need to re-upload
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(classes));
                    console.log(`Cached ${classes.length} classes to localStorage`);
                } catch {
                    // localStorage full or unavailable — ignore
                }
            })
            .catch((err) => {
                console.error("Schedule parse error:", err);
                setError("Failed to parse schedule. Please try again.");
                setIsLoading(false);
            });
    }, [status]);

    return (
        <ScheduleContext.Provider
            value={{
                allClassesByDay,
                availableDays,
                selectedDay,
                classes,
                walkingSegments,
                gaps,
                isLoading,
                error,
                hasRealData,
                uploadFile,
                setSelectedDay,
                clearSchedule,
            }}
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
