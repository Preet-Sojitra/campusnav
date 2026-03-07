/**
 * Home Page – NebulaLearn schedule view.
 *
 * Full-width, single-column layout:
 *  ┌──────────────────────────────────────────┐
 *  │  Navbar  (blue bar, logo + profile)      │
 *  ├──────────────────────────────────────────┤
 *  │                                          │
 *  │  Today's Schedule                        │
 *  │  Timeline (classes / walks / gap card)   │
 *  │                                          │
 *  ├──────────────────────────────────────────┤
 *  │  Footer  (copyright + links)             │
 *  └──────────────────────────────────────────┘
 *
 * Data is sourced from `lib/data.ts` mock objects.
 */

import Navbar from "@/components/Navbar";
import ScheduleTimeline from "@/components/ScheduleTimeline";
import Footer from "@/components/Footer";
import { scheduleClasses, walkingSegments, scheduleGap } from "@/lib/data";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <ScheduleTimeline
            classes={scheduleClasses}
            walkingSegments={walkingSegments}
            gap={scheduleGap}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
