"use client";

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
 *   NavigationAlert  – Orange banner that appears ~5 min before class ends,
 *                      showing "Leave in X min" and walk time to next class.
 *
 * Class statuses are computed dynamically from the virtual clock time.
 */

import { useState } from "react";
import {
  MapPin,
  User,
  Footprints,
  Clock,
  Navigation,
  Calendar,
  Map as MapIcon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import type { ScheduleClass, ScheduleGap, WalkingSegment, ClassStatus } from "@/lib/types";
import { getClassStatus, parseScheduleTime } from "@/lib/virtual-clock";

/* ── Inline map iframe shown beneath Navigate buttons ── */
export function MapEmbed({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="mt-3 animate-[fadeIn_0.3s_ease-out]">
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <iframe
          src={url}
          title="Campus Map Directions"
          className="w-full border-0"
          style={{ height: "350px" }}
          allow="geolocation"
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[12px] font-semibold text-nebula hover:text-nebula-dark transition-colors"
        >
          <ExternalLink size={12} /> Open in new tab
        </a>
        <button
          type="button"
          onClick={onClose}
          className="text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          Hide Map
        </button>
      </div>
    </div>
  );
}

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

/**
 * Compute how many minutes remain until the class ends.
 */
function minutesUntilEnd(cls: ScheduleClass, virtualNow: Date): number {
  const end = parseScheduleTime(cls.endTime, virtualNow);
  return Math.max(0, Math.floor((end.getTime() - virtualNow.getTime()) / 60000));
}

/**
 * NavigationAlert – shown on the current class card when class is about
 * to end. Shows walk time to next class and "leave by" time.
 */
function NavigationAlert({
  minutesLeft,
  walkDurationSeconds,
  leaveByTime,
  directionsUrl,
}: {
  minutesLeft: number;
  walkDurationSeconds?: number | null;
  leaveByTime?: string | null;
  directionsUrl?: string | null;
}) {
  const [showMap, setShowMap] = useState(false);
  const walkMin = walkDurationSeconds
    ? Math.ceil(walkDurationSeconds / 60)
    : null;

  return (
    <div className="mt-3 rounded-lg border border-flame/30 bg-flame-light p-3 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center gap-2 mb-1.5">
        <AlertTriangle size={14} className="text-flame" />
        <span className="text-[12px] font-bold uppercase tracking-wider text-flame">
          Time to go!
        </span>
      </div>
      <p className="text-[13px] font-semibold text-gray-800">
        {minutesLeft <= 0
          ? "Class has ended"
          : `${minutesLeft} min remaining`}
        {leaveByTime && (
          <span className="text-gray-500 font-normal">
            {" "}· Leave by {leaveByTime}
          </span>
        )}
      </p>
      {walkMin && (
        <p className="text-[12px] text-gray-500 mt-0.5">
          <Footprints size={11} className="inline mr-1" />
          {walkMin} min walk to next class
        </p>
      )}
      {directionsUrl && (
        <>
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-flame px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-flame-dark"
          >
            <Navigation size={12} /> {showMap ? "Hide Map" : "Navigate Now"}
            <ArrowRight size={12} />
          </button>
          {showMap && (
            <MapEmbed url={directionsUrl} onClose={() => setShowMap(false)} />
          )}
        </>
      )}
    </div>
  );
}

function ClassCard({ cls, virtualNow }: { cls: ScheduleClass; virtualNow: Date }) {
  const status = getClassStatus(cls, virtualNow);
  const isCurrent = status === "current";
  const isCompleted = status === "completed";

  const minLeft = isCurrent ? minutesUntilEnd(cls, virtualNow) : null;
  // Show navigation alert when ≤ 10 min remain in current class
  const showNavAlert = isCurrent && minLeft !== null && minLeft <= 10;

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
      <div className={`flex-1 rounded-xl border px-6 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-transform duration-150 ease-out transform hover:scale-101 hover:shadow-sm ${isCompleted ? "border-gray-200 bg-gray-50" : "border-gray-200 bg-white"
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
          <div className="shrink-0 text-right pt-1">
            <span className="text-[13px] text-gray-400">
              {cls.startTime} - {cls.endTime}
            </span>
            {/* Leave-by time badge (always visible if present, more prominent than walking segment) */}
            {cls.leaveByTime && !isCompleted && (
              <div className="mt-1.5 flex items-center gap-1 justify-end">
                <Clock size={11} className="text-flame" />
                <span className="text-[11px] font-semibold text-flame">
                  Leave by {cls.leaveByTime}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation alert banner — shows when class is about to end */}
        {showNavAlert && (
          <NavigationAlert
            minutesLeft={minLeft!}
            walkDurationSeconds={cls.walkDurationSeconds}
            leaveByTime={cls.leaveByTime}
            directionsUrl={cls.directionsUrl}
          />
        )}
      </div>
    </div>
  );
}

function WalkingIndicator({ segment, isLeaveByActive = false }: { segment: WalkingSegment; isLeaveByActive?: boolean }) {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="relative flex">
      <div className="relative flex w-10 shrink-0 flex-col items-center">
        <div className="w-px flex-1 bg-gray-200" />
        <Footprints
          size={20}
          className={`my-1 transition-colors duration-300 ${isLeaveByActive ? "text-orange-500" : "text-gray-400"
            }`}
        />
        <div className="w-px flex-1 bg-gray-200" />
      </div>

      <div className="flex-1 my-8 flex justify-center">
        <div className="w-3/4">
          <div
            className={`flex items-center justify-between rounded-lg px-5 py-2.5 transition-all duration-300 ${isLeaveByActive
                ? "border-2 border-orange-400 bg-orange-50 shadow-[0_0_12px_rgba(249,115,22,0.15)] animate-pulse"
                : "bg-gray-200/80"
              }`}
          >
            <span
              className={`text-[13px] font-medium transition-colors duration-300 ${isLeaveByActive ? "text-orange-700" : "text-gray-500"
                }`}
            >
              {isLeaveByActive && "🚶 "}
              {segment.duration}
            </span>
            {segment.directionsUrl && (
              <button
                type="button"
                onClick={() => setShowMap((v) => !v)}
                className="flex items-center gap-1 text-[12px] font-semibold text-nebula hover:text-nebula-dark transition-colors"
              >
                <Navigation size={12} /> {showMap ? "Hide Map" : "Navigate"}
              </button>
            )}
          </div>
          {showMap && segment.directionsUrl && (
            <MapEmbed url={segment.directionsUrl} onClose={() => setShowMap(false)} />
          )}
        </div>
      </div>
    </div>
  );
}

function GapCard({ gap }: { gap: ScheduleGap }) {
  const [showMap, setShowMap] = useState(false);

  if (!gap.suggestedSpot.name) return null;

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
      <div className="my-8 flex-1 flex justify-center">
        <div className="w-3/4 rounded-xl border border-indigo-200 bg-nebula-light/50 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
          {/* Gap info text */}
          <div className="space-y-1 md:flex-1">
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
          {/* Suggested spot + navigate */}
          <div className="flex flex-col gap-3 md:w-80">
            {/* Spot card */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div>
                <p className="text-sm font-bold text-gray-900 leading-snug">
                  {gap.suggestedSpot.name}
                </p>
                <p className="mt-0.5 text-[12px] text-gray-500">
                  {gap.suggestedSpot.walkTime} · {gap.suggestedSpot.amenity}
                </p>
              </div>
              {gap.directionsUrl && (
                <button
                  type="button"
                  onClick={() => setShowMap((v) => !v)}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-nebula px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-nebula-dark"
                >
                  <Navigation size={14} /> {showMap ? "Hide Map" : "Navigate"}
                </button>
              )}
            </div>

            {/* Inline map iframe (appears below the spot card, spans the spot column) */}
            {showMap && gap.directionsUrl && (
              <div>
                <MapEmbed url={gap.directionsUrl} onClose={() => setShowMap(false)} />
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DAY_LABELS: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

const DAY_SHORT: string[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

interface ScheduleTimelineProps {
  classes: ScheduleClass[];
  walkingSegments: WalkingSegment[];
  gap: ScheduleGap;
  virtualNow: Date;
  /** Available day codes from uploaded schedule (empty = demo mode) */
  availableDays?: string[];
  /** Currently selected day */
  selectedDay?: string;
  /** Callback to switch days */
  onDayChange?: (day: string) => void;
}

{/* Loop through class schedule for the day to generate the appropriate number of gap cards, class cards*/ }
export default function ScheduleTimeline({
  classes,
  walkingSegments,
  gap,
  virtualNow,
  availableDays = [],
  selectedDay = "",
  onDayChange,
}: ScheduleTimelineProps) {
  const [showDayPicker, setShowDayPicker] = useState(false);

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

  const headingLabel =
    selectedDay && DAY_LABELS[selectedDay]
      ? `${DAY_LABELS[selectedDay]}'s Schedule`
      : "Today\u2019s Schedule";

  // Build the timeline items dynamically
  const timelineItems: React.ReactNode[] = [];
  for (let i = 0; i < classes.length; i++) {
    // Add the class card
    timelineItems.push(
      <ClassCard key={`class-${classes[i].id}`} cls={classes[i]} virtualNow={virtualNow} />,
    );

    // After each class (except the last), add walking segment or gap
    if (i < classes.length - 1) {
      const segment = walkingSegments[i];

      const currentEnd = parseScheduleTime(classes[i].endTime, virtualNow);
      const nextStart = parseScheduleTime(classes[i + 1].startTime, virtualNow);
      const gapMinutes = Math.floor(
        (nextStart.getTime() - currentEnd.getTime()) / 60000,
      );

      if (gapMinutes >= 45 && gap.suggestedSpot.name) {
        // Fall back to the walking segment's directionsUrl if the gap object doesn't have one.
        // The gap object only gets a directionsUrl when primaryEmptyRoom is available in the
        // dashboard; otherwise it comes from context with no URL set.
        const gapWithUrl = gap.directionsUrl
          ? gap
          : { ...gap, directionsUrl: segment?.directionsUrl ?? null };
        timelineItems.push(<GapCard key={`gap-${i}`} gap={gapWithUrl} />);
      } else if (segment) {
        // Determine if leave-by time has passed for this class
        const cls = classes[i];
        let leaveByActive = false;
        if (cls.leaveByTime) {
          const leaveByDate = parseScheduleTime(cls.leaveByTime, virtualNow);
          const nextStart = parseScheduleTime(classes[i + 1].startTime, virtualNow);
          leaveByActive = virtualNow >= leaveByDate && virtualNow < nextStart;
        }
        timelineItems.push(
          <WalkingIndicator key={`walk-${i}`} segment={segment} isLeaveByActive={leaveByActive} />,
        );
      }
    }
  }

  return (
    <section>
      {/* Section heading row */}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-extrabold text-gray-900 leading-tight">
            {headingLabel}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            <strong>Today:</strong> {dateStr} &bull; {remaining} Class{remaining !== 1 ? "es" : ""} Remaining
          </p>
        </div>
        <div className="flex gap-2">
          {/* Day picker toggle OR static calendar button */}
          {availableDays.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowDayPicker((v) => !v)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors ${showDayPicker
                ? "border-nebula bg-nebula text-white"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
            >
              <Calendar size={15} />
              {selectedDay ? DAY_LABELS[selectedDay]?.slice(0, 3) ?? "Day" : "Calendar"}
            </button>
          ) : (
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <Calendar size={15} /> Calendar
            </button>
          )}
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

      {/* Day picker pills */}
      {showDayPicker && availableDays.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 animate-[fadeIn_0.2s_ease-out]">
          {DAY_SHORT.filter((d) => d !== "SAT" && d !== "SUN").map((day) => {
            const isAvailable = availableDays.includes(day);
            const isSelected = day === selectedDay;
            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  if (onDayChange) {
                    onDayChange(day);
                  }
                }}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${isSelected
                  ? "bg-nebula text-white shadow-sm scale-105"
                  : isAvailable
                    ? "bg-white border border-gray-200 text-gray-700 hover:bg-nebula-light hover:text-nebula hover:border-nebula/30"
                    : "bg-white border border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500"
                  }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      )}

      {/* Dynamic timeline */}
      <div>
        {timelineItems.length > 0 ? (
          timelineItems
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-400 font-medium">No classes on {selectedDay ? DAY_LABELS[selectedDay] : "this day"}</p>
          </div>
        )}
      </div>
    </section>
  );
}

