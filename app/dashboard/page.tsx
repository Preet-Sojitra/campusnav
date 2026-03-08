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
import { useVirtualClock } from "@/lib/virtual-clock";
import Link from "next/link";
import { Suspense } from "react";

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

    const scheduleClasses = useDemo ? demoClasses : classes;
    const scheduleWalking = useDemo ? demoWalking : walkingSegments;
    const scheduleGap = useDemo
        ? demoGap
        : gaps[0] || {
            duration: "0m",
            durationMinutes: 0,
            message: "",
            suggestedSpot: { name: "", badge: "", walkTime: "", amenity: "" },
        };

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
                        gap={scheduleGap}
                        virtualNow={now}
                        availableDays={useDemo ? [] : availableDays}
                        selectedDay={useDemo ? "" : selectedDay}
                        onDayChange={useDemo ? undefined : setSelectedDay}
                    />

                    {/* Right: Sidebar */}
                    <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
                        <NearbySpaces spaces={nearbySpaces} />
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
