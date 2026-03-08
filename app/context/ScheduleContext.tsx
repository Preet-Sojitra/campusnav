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
    loading: boolean;
    error: string | null;
}

interface ScheduleState {
    classes: ClassEntry[];
    routes: RouteEntry[];
    isLoading: boolean;
    error: string | null;
    uploadFile: (file: File) => void;
}

const ScheduleContext = createContext<ScheduleState | null>(null);

/**
 * Given a flat list of classes, group by day and sort by startTime,
 * then return consecutive pairs on the same day.
 */
function computeConsecutivePairs(classes: ClassEntry[]): [ClassEntry, ClassEntry][] {
    const byDay: Record<string, ClassEntry[]> = {};
    for (const c of classes) {
        const day = c.day.toUpperCase();
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(c);
    }

    const pairs: [ClassEntry, ClassEntry][] = [];
    for (const day of Object.keys(byDay)) {
        const sorted = byDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
        for (let i = 0; i < sorted.length - 1; i++) {
            pairs.push([sorted[i], sorted[i + 1]]);
        }
    }
    return pairs;
}

export function ScheduleProvider({ children }: { children: ReactNode }) {
    const [classes, setClasses] = useState<ClassEntry[]>([]);
    const [routes, setRoutes] = useState<RouteEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Resolve directions whenever classes change
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

        // Initialize route entries in loading state
        const initial: RouteEntry[] = pairs.map(([from, to]) => ({
            from,
            to,
            directionsUrl: null,
            formattedDuration: null,
            loading: true,
            error: null,
        }));
        setRoutes(initial);

        // Resolve each pair in parallel
        pairs.forEach(([from, to], idx) => {
            const params = new URLSearchParams({ from: from.room, to: to.room });
            fetch(`/api/map/directions?${params.toString()}`)
                .then(async (res) => {
                    if (!res.ok) {
                        const body = await res.json().catch(() => ({}));
                        throw new Error(body.error || `HTTP ${res.status}`);
                    }
                    return res.json();
                })
                .then(async (data) => {
                    let formattedDuration: string | null = null;
                    if (data.url) {
                        try {
                            const durRes = await fetch(
                                `/api/map/directions/duration?url=${encodeURIComponent(data.url)}`
                            );
                            if (durRes.ok) {
                                const durData = await durRes.json();
                                formattedDuration = durData.formattedDuration ?? null;
                            }
                        } catch {
                            // duration is optional — swallow errors
                        }
                    }
                    setRoutes((prev) =>
                        prev.map((r, i) =>
                            i === idx
                                ? { ...r, directionsUrl: data.url, formattedDuration, loading: false }
                                : r
                        )
                    );
                })
                .catch((err) => {
                    setRoutes((prev) =>
                        prev.map((r, i) =>
                            i === idx ? { ...r, loading: false, error: err.message } : r
                        )
                    );
                });
        });
    }, [classes]);

    const uploadFile = useCallback((file: File) => {
        setIsLoading(true);
        setError(null);
        setClasses([]);
        setRoutes([]);

        const formData = new FormData();
        formData.append("file", file);

        fetch("/api/upload", { method: "POST", body: formData })
            .then(async (res) => {
                if (!res.ok) throw new Error("Upload failed");
                const data = await res.json();

                // The API returns schedule as a JSON string — parse it
                let parsed = data.schedule;
                if (typeof parsed === "string") {
                    // Strip markdown code fences if present
                    parsed = parsed.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
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
        <ScheduleContext.Provider value={{ classes, routes, isLoading, error, uploadFile }}>
            {children}
        </ScheduleContext.Provider>
    );
}

export function useSchedule() {
    const ctx = useContext(ScheduleContext);
    if (!ctx) throw new Error("useSchedule must be used within ScheduleProvider");
    return ctx;
}
