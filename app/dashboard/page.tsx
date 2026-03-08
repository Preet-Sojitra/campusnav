"use client";

/**
 * Dashboard Page – Shows the schedule timeline with real API data.
 * Supports day switching via the ScheduleContext.
 */

import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ScheduleTimeline from "@/components/ScheduleTimeline";
import NearbySpaces from "@/components/NearbySpaces";
import CampusTransit from "@/components/CampusTransit";
import Footer from "@/components/Footer";
import { useSchedule } from "@/app/context/ScheduleContext";
import {
    scheduleClasses as demoClasses,
    walkingSegments as demoWalking,
    scheduleGap as demoGap,
    nearbySpaces,
    campusTransit,
} from "@/lib/data";
import { useVirtualClock, parseScheduleTime } from "@/lib/virtual-clock";
import { useLeaveByToast } from "@/lib/useLeaveByToast";
import { useDynamicRooms } from "@/lib/useDynamicRooms";
import Link from "next/link";
import { Suspense, useMemo } from "react";

function DashboardContent() {
    const searchParams = useSearchParams();
    const isDemo = searchParams.get("demo") === "1";
    const {
        classes,
        walkingSegments,
        gaps,
        isLoading,
        error,
        hasRealData,
        availableDays,
        selectedDay,
        setSelectedDay,
    } = useSchedule();
    const { now } = useVirtualClock();

    const useDemo = isDemo || (!hasRealData && !isLoading && !error);
    const { primaryEmptyRoom, sidebarEmptyRooms, emptyRoomsByGapIndex } = useDynamicRooms(
        useDemo ? demoClasses : classes,
        now,
        useDemo,
        selectedDay
    );

    // Fire toast notifications when leave-by times are crossed
    useLeaveByToast(useDemo ? demoClasses : classes, now);

    const scheduleClasses = useDemo ? demoClasses : classes;
    const scheduleWalking = useDemo ? demoWalking : walkingSegments;

    // Build one gap card per gap; use real empty room data per gap when available
    const scheduleGaps = useMemo(() => {
        const displayedClasses = useDemo ? demoClasses : classes;
        let gapCount = 0;
        for (let i = 0; i < displayedClasses.length - 1; i++) {
            const end = parseScheduleTime(displayedClasses[i].endTime, now);
            const start = parseScheduleTime(displayedClasses[i + 1].startTime, now);
            if ((start.getTime() - end.getTime()) / 60000 >= 45) gapCount++;
        }
        if (useDemo) return Array.from({ length: gapCount }, () => demoGap);
        return gaps.slice(0, gapCount).map((g, i) => {
            const empty = emptyRoomsByGapIndex[i]?.primary;
            if (!empty || !g.durationMinutes) return g;
            return {
                duration: g.duration,
                durationMinutes: g.durationMinutes,
                message: "Maximize your time between classes",
                directionsUrl: empty._directionsUrl ?? null,
                suggestedSpot: {
                    name: empty.room,
                    badge: "CLOSEST EMPTY ROOM",
                    walkTime: empty._walkDurationStr ?? "Nearest available",
                    amenity: "Empty classroom",
                },
            };
        });
    }, [useDemo, gaps, emptyRoomsByGapIndex, classes, now]);

    // Determine if NearbySpaces should be visible:
    // Show when there's a gap AND we're within 15 min before gap starts or during the gap
    const showNearbySpaces = useMemo(() => {
        if (useDemo) return true; // Always show in demo mode

        const activeClasses = useDemo ? demoClasses : classes;
        if (gaps.length === 0 || activeClasses.length < 2) return false;

        // Find the gap between classes
        for (let i = 0; i < activeClasses.length - 1; i++) {
            const currentEnd = parseScheduleTime(activeClasses[i].endTime, now);
            const nextStart = parseScheduleTime(activeClasses[i + 1].startTime, now);
            const gapMs = nextStart.getTime() - currentEnd.getTime();
            const gapMinutes = gapMs / 60000;

            if (gapMinutes >= 45) {
                // Gap found — show sidebar from 15 min before gap starts until gap ends
                const showFromMs = currentEnd.getTime() - 15 * 60000;
                const showUntilMs = nextStart.getTime();
                const nowMs = now.getTime();

                if (nowMs >= showFromMs && nowMs <= showUntilMs) {
                    return true;
                }
            }
        }

        // Also show if we have empty room data (API returned results)
        return sidebarEmptyRooms.length > 0;
    }, [useDemo, classes, gaps, now, sidebarEmptyRooms]);

    /* ─── Loading State ─── */
    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col bg-background">
                <Navbar />
                <main className="flex-1 flex items-center justify-center px-4 py-16">
                    <div className="text-center">
                        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-nebula-light">
                            <svg className="animate-spin" width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <circle cx="14" cy="14" r="12" stroke="#e5e7eb" strokeWidth="2.5" />
                                <path d="M14 2A12 12 0 0 1 26 14" stroke="#4338ca" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">
                            <span className="loading-ellipsis">Analyzing your schedule</span>
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Extracting classes and finding the best routes…
                        </p>
                        <div className="mx-auto mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-gray-200">
                            <div className="loading-progress-bar h-full rounded-full bg-nebula" />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    /* ─── Error State ─── */
    if (error) {
        return (
            <div className="flex min-h-screen flex-col bg-background">
                <Navbar />
                <main className="flex-1 flex items-center justify-center px-4 py-16">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <circle cx="14" cy="14" r="12" stroke="#ef4444" strokeWidth="2" />
                                <path d="M14 9V15M14 19H14.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
                        <p className="mt-2 text-sm text-gray-500">{error}</p>
                        <Link
                            href="/"
                            className="mt-6 inline-block rounded-lg bg-nebula px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-nebula-dark"
                        >
                            ← Try Again
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />

            <main className="flex-1 px-6 py-10">
                <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
                    {/* Left: Schedule timeline */}
                    <ScheduleTimeline
                        classes={scheduleClasses}
                        walkingSegments={scheduleWalking}
                        gaps={scheduleGaps}
                        virtualNow={now}
                        availableDays={useDemo ? [] : availableDays}
                        selectedDay={useDemo ? "" : selectedDay}
                        onDayChange={useDemo ? undefined : setSelectedDay}
                    />

                    {/* Right: Sidebar */}
                    <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
                        {showNearbySpaces ? (
                            <NearbySpaces
                                spaces={nearbySpaces}
                                emptyRooms={useDemo ? [] : sidebarEmptyRooms}
                            />
                        ) : (
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4338ca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <h3 className="text-[15px] font-extrabold text-gray-900">
                                        Nearby Empty Classes
                                    </h3>
                                </div>
                                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center">
                                    <p className="text-sm text-gray-400 font-medium">No large gaps detected</p>
                                    <p className="mt-1 text-xs text-gray-300">Room suggestions appear when you have 45+ min between classes</p>
                                </div>
                            </div>
                        )}
                        <CampusTransit transit={campusTransit} />
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense>
            <DashboardContent />
        </Suspense>
    );
}
