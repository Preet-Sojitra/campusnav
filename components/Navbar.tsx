"use client";

/**
 * Navbar – Top navigation bar spanning the full viewport width.
 *
 * Background gradient mirrors the Nebula Labs brand image: deep indigo
 * on the left transitioning through violet to a warm-tinted indigo on
 * the right. A thin UTD-orange accent line runs along the bottom edge,
 * subtly bridging the two brand identities without overwhelming the
 * dark navbar surface.
 *
 * Displays the virtual clock time next to the user info.
 */

import { Clock } from "lucide-react";
import { useVirtualClock } from "@/lib/virtual-clock";

export default function Navbar() {
  const { now } = useVirtualClock();

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <nav className="relative flex items-center justify-between bg-gradient-to-r from-[#1e1b5e] via-[#4338ca] to-[#6d3fa0] px-8 py-3.5 shadow-lg">
      {/* Thin UTD-orange bottom accent stripe */}
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-flame/0 via-flame to-flame/0" />

      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="text-white"
          >
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-lg font-bold text-white">NebulaLearn</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Virtual clock display */}
        <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm">
          <Clock size={14} className="text-indigo-200" />
          <span className="text-sm font-mono font-semibold text-white">{timeStr}</span>
        </div>

        <div className="text-right leading-tight">
          <p className="text-sm font-semibold text-white">Temoc Student</p>
          <p className="text-xs text-indigo-200">Computer Science Senior</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/20 ring-2 ring-white/30">
          <span className="text-sm font-bold text-white">TS</span>
        </div>
      </div>
    </nav>
  );
}
