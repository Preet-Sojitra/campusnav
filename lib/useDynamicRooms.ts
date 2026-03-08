import { useState, useEffect, useRef } from "react";
import type { ScheduleClass, EmptyRoom } from "@/lib/types";
import { parseScheduleTime } from "@/lib/virtual-clock";
import { resolveRoute } from "@/app/context/ScheduleContext";

const GAP_THRESHOLD_MINUTES = 45;

export type EmptyRoomsForGap = { primary: EmptyRoom | null; sidebar: EmptyRoom[] };

async function resolveRoomsWithRoutes(
    rooms: EmptyRoom[],
    fromRoom: string
): Promise<EmptyRoom[]> {
    if (rooms.length === 0) return [];
    const fromBuilding = fromRoom.split(" ")[0];
    return Promise.all(
        rooms.map(async (r) => {
            const roomBuilding = (r.room || r.building || "").split(" ")[0];
            if (fromBuilding === roomBuilding) {
                return {
                    ...r,
                    _walkDurationStr: "1 min walk",
                    _directionsUrl: null,
                    _walkSeconds: 60,
                };
            }
            const route = await resolveRoute(fromRoom, r.room);
            return {
                ...r,
                _walkDurationStr: route.formattedDuration ? `${route.formattedDuration} walk` : "Nearby",
                _directionsUrl: route.directionsUrl,
                _walkSeconds: route.durationSeconds,
            };
        })
    );
}

export function useDynamicRooms(classes: ScheduleClass[], now: Date, isDemo: boolean, selectedDay: string) {
    const [primaryEmptyRoom, setPrimaryEmptyRoom] = useState<EmptyRoom | null>(null);
    const [sidebarEmptyRooms, setSidebarEmptyRooms] = useState<EmptyRoom[]>([]);
    const [emptyRoomsByGapIndex, setEmptyRoomsByGapIndex] = useState<Record<number, EmptyRoomsForGap>>({});
    const lastFetchedKeysRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (isDemo || classes.length < 2) {
            setPrimaryEmptyRoom(null);
            setSidebarEmptyRooms([]);
            setEmptyRoomsByGapIndex({});
            return;
        }

        // Collect all gaps that meet the threshold (same order as context gaps: one per long break)
        const gapSpecs: { index: number; fromRoom: string; toRoom: string; startTime24: string }[] = [];
        let gapIndex = 0;
        for (let i = 0; i < classes.length - 1; i++) {
            const currentEnd = parseScheduleTime(classes[i].endTime, now);
            const nextStart = parseScheduleTime(classes[i + 1].startTime, now);
            const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / 60000;
            if (gapMinutes >= GAP_THRESHOLD_MINUTES) {
                const gapStartDate = parseScheduleTime(classes[i].endTime, now);
                const h24 = gapStartDate.getHours().toString().padStart(2, "0");
                const m24 = gapStartDate.getMinutes().toString().padStart(2, "0");
                gapSpecs.push({
                    index: gapIndex,
                    fromRoom: classes[i].location,
                    toRoom: classes[i + 1].location,
                    startTime24: `${h24}:${m24}`,
                });
                gapIndex++;
            }
        }

        if (gapSpecs.length === 0) {
            setPrimaryEmptyRoom(null);
            setSidebarEmptyRooms([]);
            setEmptyRoomsByGapIndex({});
            return;
        }

        const fetchedKeys = new Set<string>();
        const byGapIndex: Record<number, EmptyRoomsForGap> = {};

        const runFetches = async () => {
            for (const spec of gapSpecs) {
                const gapKey = `${selectedDay}-${spec.startTime24}-${spec.fromRoom}->${spec.toRoom}`;
                if (lastFetchedKeysRef.current.has(gapKey)) {
                    continue;
                }
                fetchedKeys.add(gapKey);

                try {
                    const params = new URLSearchParams({
                        from: spec.fromRoom,
                        to: spec.toRoom,
                        day: selectedDay,
                        startTime: spec.startTime24,
                    });
                    const res = await fetch(`/api/empty-room?${params.toString()}`);
                    if (!res.ok) continue;
                    const data = await res.json();
                    const rooms: EmptyRoom[] = data.rooms ?? [];
                    const resolved = await resolveRoomsWithRoutes(rooms, spec.fromRoom);
                    byGapIndex[spec.index] = {
                        primary: resolved[0] ?? null,
                        sidebar: resolved.slice(1),
                    };
                } catch (err) {
                    console.error("Dynamic empty room fetch error:", err);
                }
            }

            lastFetchedKeysRef.current = new Set([...lastFetchedKeysRef.current, ...fetchedKeys]);

            // Merge new results and set primary/sidebar from merged state for the active gap
            setEmptyRoomsByGapIndex((prev) => {
                const next = { ...prev, ...byGapIndex };
                let activeIdx = -1;
                for (let i = 0; i < classes.length - 1; i++) {
                    const nextStart = parseScheduleTime(classes[i + 1].startTime, now);
                    const currentEnd = parseScheduleTime(classes[i].endTime, now);
                    const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / 60000;
                    if (gapMinutes >= GAP_THRESHOLD_MINUTES && now.getTime() < nextStart.getTime()) {
                        const spec = gapSpecs.find(
                            (s) => s.fromRoom === classes[i].location && s.toRoom === classes[i + 1].location
                        );
                        if (spec !== undefined) {
                            activeIdx = spec.index;
                            break;
                        }
                    }
                }
                if (activeIdx >= 0 && next[activeIdx]) {
                    setPrimaryEmptyRoom(next[activeIdx].primary);
                    setSidebarEmptyRooms(next[activeIdx].sidebar);
                } else if (gapSpecs.length === 0) {
                    setPrimaryEmptyRoom(null);
                    setSidebarEmptyRooms([]);
                }
                return next;
            });
        };

        runFetches();
    }, [classes, now, isDemo, selectedDay]);

    return { primaryEmptyRoom, sidebarEmptyRooms, emptyRoomsByGapIndex };
}
