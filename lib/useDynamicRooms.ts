import { useState, useEffect, useRef } from "react";
import type { ScheduleClass, EmptyRoom } from "@/lib/types";
import { parseScheduleTime } from "@/lib/virtual-clock";
import { resolveRoute } from "@/app/context/ScheduleContext";

const GAP_THRESHOLD_MINUTES = 45;

export function useDynamicRooms(classes: ScheduleClass[], now: Date, isDemo: boolean, selectedDay: string) {
    const [primaryEmptyRoom, setPrimaryEmptyRoom] = useState<EmptyRoom | null>(null);
    const [sidebarEmptyRooms, setSidebarEmptyRooms] = useState<EmptyRoom[]>([]);
    const [fromRoom, setFromRoom] = useState<string | null>(null);
    const lastFetchedGapRef = useRef<string | null>(null);

    useEffect(() => {
        if (isDemo || classes.length < 2) return;

        // 1. Find the RELEVANT gap for the current time
        let activeGapIndex = -1;

        for (let i = 0; i < classes.length - 1; i++) {
            const currentEnd = parseScheduleTime(classes[i].endTime, now);
            const nextStart = parseScheduleTime(classes[i + 1].startTime, now);
            const gapMs = nextStart.getTime() - currentEnd.getTime();
            const gapMinutes = gapMs / 60000;

            if (gapMinutes >= GAP_THRESHOLD_MINUTES) {
                // Relevant if the next class hasn't started yet
                if (now.getTime() < nextStart.getTime()) {
                    activeGapIndex = i;
                    break;
                }
            }
        }

        if (activeGapIndex === -1) {
            // No upcoming gaps
            setPrimaryEmptyRoom(null);
            setSidebarEmptyRooms([]);
            setFromRoom(null);
            lastFetchedGapRef.current = null;
            return;
        }

        const gapFromRoom = classes[activeGapIndex].location;
        setFromRoom(gapFromRoom);
        const toRoom = classes[activeGapIndex + 1].location;
        const gapStartTimeStr = classes[activeGapIndex].endTime; // 12-hr format

        // Convert to 24hr format for API
        const gapStartDate = parseScheduleTime(gapStartTimeStr, now);
        const h24 = gapStartDate.getHours().toString().padStart(2, "0");
        const m24 = gapStartDate.getMinutes().toString().padStart(2, "0");
        const gapStartTime24 = `${h24}:${m24}`;

        const gapKey = `${selectedDay}-${gapStartTime24}-${fromRoom}->${toRoom}`;

        // 2. Fetch if we found a new gap
        if (lastFetchedGapRef.current !== gapKey) {
            lastFetchedGapRef.current = gapKey;

            const params = new URLSearchParams({
                from: gapFromRoom,
                to: toRoom,
                day: selectedDay,
                startTime: gapStartTime24,
            });

            fetch(`/api/empty-room?${params.toString()}`)
                .then(async (res) => {
                    if (!res.ok) return;
                    const data = await res.json();
                    let rooms: EmptyRoom[] = data.rooms ?? [];

                    if (rooms.length > 0) {
                        // Optimistically set them
                        setPrimaryEmptyRoom(rooms[0]);
                        setSidebarEmptyRooms(rooms.slice(1));

                        // Route resolution
                        Promise.all(rooms.map(async (r) => {
                            const fromBuilding = gapFromRoom.split(" ")[0];
                            const toBuilding = r.room.split(" ")[0];

                            const route = await resolveRoute(gapFromRoom, r.room);

                            if (fromBuilding === toBuilding) {
                                return {
                                    ...r,
                                    _walkDurationStr: "1 min walk",
                                    _directionsUrl: route.directionsUrl,
                                    _walkSeconds: 60,
                                };
                            }

                            return {
                                ...r,
                                _walkDurationStr: route.formattedDuration ? `${route.formattedDuration} walk` : "Nearby",
                                _directionsUrl: route.directionsUrl,
                                _walkSeconds: route.durationSeconds,
                            };
                        })).then((resolvedRooms) => {
                            if (resolvedRooms.length > 0) {
                                setPrimaryEmptyRoom(resolvedRooms[0]);
                                setSidebarEmptyRooms(resolvedRooms.slice(1));
                            }
                        });
                    } else {
                        setPrimaryEmptyRoom(null);
                        setSidebarEmptyRooms([]);
                    }
                })
                .catch((err) => console.error("Dynamic empty room fetch error:", err));
        }

    }, [classes, now, isDemo, selectedDay]);

    return { primaryEmptyRoom, sidebarEmptyRooms, fromRoom };
}
