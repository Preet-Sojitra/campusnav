"use client";

/**
 * Home Page – NebulaLearn schedule view.
 *
 * Two-column layout:
 *  ┌──────────────────────────────────────────────────┐
 *  │  Navbar  (gradient bar, logo + profile)          │
 *  ├───────────────────────────┬──────────────────────┤
 *  │                           │  Nearby Spaces       │
 *  │  Today's Schedule         │  (study rooms)       │
 *  │  Timeline                 ├──────────────────────┤
 *  │  (classes / walks / gap)  │  Campus Transit      │
 *  │                           │  (shuttle info)      │
 *  ├───────────────────────────┴──────────────────────┤
 *  │  Footer  (copyright + links)                     │
 *  └──────────────────────────────────────────────────┘
 *
 * Data is sourced from `lib/data.ts` mock objects.
 * Time is driven by the virtual clock context.
 */

import Navbar from "@/components/Navbar";
import ScheduleTimeline from "@/components/ScheduleTimeline";
import NearbySpaces from "@/components/NearbySpaces";
import CampusTransit from "@/components/CampusTransit";
import Footer from "@/components/Footer";
import {
  scheduleClasses,
  walkingSegments,
  scheduleGap,
  nearbySpaces,
  campusTransit,
} from "@/lib/data";
import { useVirtualClock } from "@/lib/virtual-clock";

export default function Home() {
  const { now } = useVirtualClock();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
          {/* Left: Schedule timeline */}
          <ScheduleTimeline
            classes={scheduleClasses}
            walkingSegments={walkingSegments}
            gap={scheduleGap}
            virtualNow={now}
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
