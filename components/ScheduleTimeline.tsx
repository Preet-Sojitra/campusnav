/**
 * ScheduleTimeline – Vertical timeline rendering a student's daily classes.
 *
 * The timeline is composed of three visual element types stitched together
 * by a thin vertical connector line:
 *
 *   ClassCard        – A bordered card for each class. Its left-edge
 *                      timeline dot is filled blue for "current", hollow
 *                      for everything else. A coloured badge communicates
 *                      the class's temporal status.
 *
 *   WalkingIndicator – A light-grey pill that sits between two consecutive
 *                      classes showing the estimated walk time, preceded
 *                      by a small footprints icon on the timeline rail.
 *
 *   GapCard          – A highlighted card (blue tint) that appears when
 *                      there is a long break between classes.  It contains
 *                      the gap duration, a motivational message, a map
 *                      thumbnail of the suggested study spot, and Navigate
 *                      / Summary action buttons.
 *
 * The parent component is responsible for ordering these elements; the
 * ScheduleTimeline export wires them together in the sequence shown in
 * the Figma spec.
 */

import {
  MapPin,
  User,
  Footprints,
  Clock,
  Navigation,
  Headphones,
  Calendar,
  Map as MapIcon,
} from "lucide-react";
import type { ScheduleClass, ScheduleGap, WalkingSegment } from "@/lib/types";

const STATUS_BADGE_STYLE: Record<string, string> = {
  current: "bg-blue-600 text-white",
  upcoming: "border border-blue-600 text-blue-600 bg-white",
  "late-afternoon": "border border-gray-300 text-gray-500 bg-white",
};

const STATUS_BADGE_LABEL: Record<string, string> = {
  current: "CURRENT CLASS",
  upcoming: "UPCOMING",
  "late-afternoon": "LATE AFTERNOON",
};

function ClassCard({ cls }: { cls: ScheduleClass }) {
  const isCurrent = cls.status === "current";

  return (
    <div className="relative flex">
      {/* Timeline rail: dot + vertical line */}
      <div className="relative flex w-10 shrink-0 flex-col items-center">
        <div
          className={`z-10 mt-5 h-3 w-3 rounded-full border-2 ${
            isCurrent
              ? "border-blue-600 bg-blue-600"
              : "border-gray-300 bg-white"
          }`}
        />
        <div className="w-px flex-1 bg-gray-200" />
      </div>

      {/* Card */}
      <div className="mb-2 flex-1 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-start justify-between">
          <div>
            <span
              className={`inline-block rounded px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE_STYLE[cls.status]}`}
            >
              {STATUS_BADGE_LABEL[cls.status]}
            </span>
            <h3 className="mt-2.5 text-[15px] font-bold text-gray-900 leading-snug">
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

      <div className="my-1 flex flex-1 items-center rounded-lg bg-gray-100/80 px-5 py-2.5">
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
        <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50">
          <Clock size={14} className="text-blue-600" />
        </div>
        <div className="w-px flex-1 bg-gray-200" />
      </div>

      {/* Gap card */}
      <div className="my-3 flex-1 rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Left: gap info text */}
          <div className="flex-1 space-y-0.5 pt-1">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              <span className="text-sm font-bold text-blue-800">
                {gap.duration} Gap Detected
              </span>
            </div>
            <p className="text-[13px] text-blue-600">{gap.message}</p>
          </div>

          {/* Right: suggested spot with map thumbnail */}
          <div className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex h-[88px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
              <MapIcon size={26} className="text-gray-300" />
            </div>
            <div className="flex flex-col justify-center gap-1">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-blue-600">
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
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Navigation size={14} /> Navigate
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Headphones size={14} /> Summary
          </button>
        </div>
      </div>
    </div>
  );
}

interface ScheduleTimelineProps {
  classes: ScheduleClass[];
  walkingSegments: WalkingSegment[];
  gap: ScheduleGap;
}

export default function ScheduleTimeline({
  classes,
  walkingSegments,
  gap,
}: ScheduleTimelineProps) {
  return (
    <section>
      {/* Section heading row */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-extrabold text-gray-900 leading-tight">
            Today&apos;s Schedule
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Monday, October 23rd &bull; {classes.length} Classes Remaining
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Calendar size={15} /> Calendar
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <MapIcon size={15} /> Campus Map
          </button>
        </div>
      </div>

      {/* Timeline sequence: class → walk → class → gap → class */}
      <div>
        <ClassCard cls={classes[0]} />

        {walkingSegments[0] && <WalkingIndicator segment={walkingSegments[0]} />}

        {classes[1] && <ClassCard cls={classes[1]} />}

        <GapCard gap={gap} />

        {classes.slice(2).map((cls) => (
          <ClassCard key={cls.id} cls={cls} />
        ))}
      </div>
    </section>
  );
}
