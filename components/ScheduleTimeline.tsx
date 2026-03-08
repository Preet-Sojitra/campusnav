/**
 * ScheduleTimeline – Vertical timeline rendering a student's daily classes.
 *
 * Color conventions:
 *  - Nebula indigo (#4338CA)  → primary actions, upcoming badge, buttons,
 *                                gap-card accents, and the "Campus Map" CTA.
 *  - UTD Orange (#ec7524)     → "CURRENT CLASS" badge and active timeline
 *                                dot — the eye is drawn here first.
 *  - UTD Green (#114634)      → reserved for small success indicators
 *                                (e.g. availability badges); not used
 *                                inside the timeline itself.
 *
 * Visual element types:
 *   ClassCard        – Card per class; orange dot for current, hollow for rest.
 *   WalkingIndicator – Light pill showing walk time between classes.
 *   GapCard          – Indigo-tinted card for long breaks with study spot
 *                      suggestion and action buttons.
 *
 * Class statuses are computed dynamically from the virtual clock time.
 */

import Image from "next/image";
import {
  MapPin,
  User,
  Footprints,
  Clock,
  Navigation,
  Headphones,
  Calendar,
  Map as MapIcon,
  CheckCircle2,
} from "lucide-react";
import type { ScheduleClass, ScheduleGap, WalkingSegment, ClassStatus } from "@/lib/types";
import { getClassStatus } from "@/lib/virtual-clock";

const STATUS_BADGE_STYLE: Record<ClassStatus, string> = {
  completed: "bg-gray-200 text-gray-500",
  current: "bg-flame text-white",
  upcoming: "border border-nebula text-nebula bg-white",
  "late-afternoon": "border border-gray-300 text-gray-500 bg-white",
};

const STATUS_BADGE_LABEL: Record<ClassStatus, string> = {
  completed: "COMPLETED",
  current: "CURRENT CLASS",
  upcoming: "UPCOMING",
  "late-afternoon": "LATE AFTERNOON",
};

function ClassCard({ cls, virtualNow }: { cls: ScheduleClass; virtualNow: Date }) {
  const status = getClassStatus(cls, virtualNow);
  const isCurrent = status === "current";
  const isCompleted = status === "completed";

  return (
    <div className={`relative flex transition ${isCompleted ? "opacity-60" : ""}`}>
      {/* Timeline rail: dot + vertical line */}
      <div className="relative flex w-10 shrink-0 flex-col items-center">
        <div
          className={`z-10 mt-5 h-3 w-3 rounded-full border-2 ${isCompleted
            ? "border-gray-300 bg-gray-300"
            : isCurrent
              ? "border-flame bg-flame"
              : "border-gray-300 bg-white"
            }`}
        />
        <div className="w-px flex-1 bg-gray-200" />
      </div>

      {/* Card */}
      <div className={`mb-2 flex-1 rounded-xl border px-6 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-transform duration-150 ease-out transform hover:scale-101 hover:shadow-sm ${isCompleted ? "border-gray-200 bg-gray-50" : "border-gray-200 bg-white"
        }`}>
        <div className="flex items-start justify-between">
          <div>
            <span
              className={`inline-block rounded px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE_STYLE[status]}`}
            >
              {isCompleted && <CheckCircle2 size={10} className="inline mr-1 -mt-0.5" />}
              {STATUS_BADGE_LABEL[status]}
            </span>
            <h3 className={`mt-2.5 text-[15px] font-bold leading-snug ${isCompleted ? "text-gray-400 line-through" : "text-gray-900"}`}>
              {cls.courseCode}: {cls.courseName}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px] text-gray-500">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-gray-400" />
                {cls.location}
              </span>
              {cls.professor && (
                <span className="flex items-center gap-1.5">
                  <User size={14} className="text-gray-400" />
                  {cls.professor}
                </span>
              )}
            </div>
          </div>
          <span className="shrink-0 text-[13px] text-gray-400 pt-1">
            {cls.startTime} - {cls.endTime}
          </span>
        </div>
      </div>
    </div>
  );
}

function WalkingIndicator({ segment }: { segment: WalkingSegment }) {
  return (
    <div className="relative flex">
      <div className="relative flex w-10 shrink-0 flex-col items-center">
        <div className="w-px flex-1 bg-gray-200" />
        <Footprints size={13} className="my-0.5 text-gray-400" />
        <div className="w-px flex-1 bg-gray-200" />
      </div>

      <div className="flex flex-1 items-center rounded-lg bg-gray-200/80 px-5 py-2.5 mt-4 mb-4">
        <span className="text-[13px] text-gray-500">{segment.duration}</span>
      </div>
    </div>
  );
}

function GapCard({ gap }: { gap: ScheduleGap }) {
  return (
    <div className="relative flex">
      {/* Timeline rail: clock icon on the connector */}
      <div className="relative flex w-10 shrink-0 flex-col items-center">
        <div className="w-px flex-1 bg-gray-200" />
        <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-nebula-light">
          <Clock size={14} className="text-nebula" />
        </div>
        <div className="w-px flex-1 bg-gray-200" />
      </div>

      {/* Gap card */}
      <div className="my-3 flex-1 rounded-xl border border-indigo-200 bg-nebula-light/50 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Left: gap info text — vertically centered */}
          <div className="flex-1 shrink-0 space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-nebula/10">
                <Clock size={15} className="text-nebula" />
              </div>
              <span className="text-[15px] font-bold text-indigo-900">
                {gap.duration} Gap Detected
              </span>
            </div>
            <p className="pl-9 text-[13px] text-nebula">{gap.message}</p>
          </div>

          {/* Right: suggested spot + action buttons stacked */}
          <div className="flex flex-col gap-3 w-[55%]">
            {/* Spot card */}
            <div className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-md w-[100px] h-[100px]">
                <Image src="/map.jpg" alt="Classroom" width={100} height={100} />
              </div>
              <div className="flex flex-col justify-center gap-1">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-nebula">
                  {gap.suggestedSpot.badge}
                </span>
                <p className="text-sm font-bold text-gray-900 leading-snug">
                  {gap.suggestedSpot.name}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Footprints size={11} /> {gap.suggestedSpot.walkTime}
                  </span>
                  <span className="flex items-center gap-1">
                    ⚡ {gap.suggestedSpot.amenity}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons — equal width, below the spot card */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-lg bg-nebula px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-nebula-dark"
              >
                <Navigation size={14} /> Navigate
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Headphones size={14} /> Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScheduleTimelineProps {
  classes: ScheduleClass[];
  walkingSegments: WalkingSegment[];
  gap: ScheduleGap;
  virtualNow: Date;
}

{/* Loop through class schedule for the day to generate the appropriate number of gap cards, class cards*/ }
export default function ScheduleTimeline({
  classes,
  walkingSegments,
  gap,
  virtualNow,
}: ScheduleTimelineProps) {
  // Format the virtual date for the heading
  const dateStr = virtualNow.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Count remaining classes (not completed)
  const remaining = classes.filter(
    (cls) => getClassStatus(cls, virtualNow) !== "completed",
  ).length;

  return (
    <section>
      {/* Section heading row */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-extrabold text-gray-900 leading-tight">
            Today&apos;s Schedule
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {dateStr} &bull; {remaining} Class{remaining !== 1 ? "es" : ""} Remaining
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Calendar size={15} /> Calendar
          </button>
          <a
            href="https://map.utdallas.edu/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-nebula px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-nebula-dark"
          >
            <MapIcon size={15} /> Campus Map
          </a>
        </div>
      </div>

      {/* Timeline sequence: class → walk → class → gap → class */}
      <div>
        <ClassCard cls={classes[0]} virtualNow={virtualNow} />

        {walkingSegments[0] && <WalkingIndicator segment={walkingSegments[0]} />}

        {classes[1] && <ClassCard cls={classes[1]} virtualNow={virtualNow} />}

        <GapCard gap={gap} />

        {classes.slice(2).map((cls) => (
          <ClassCard key={cls.id} cls={cls} virtualNow={virtualNow} />
        ))}
      </div>
    </section>
  );
}
