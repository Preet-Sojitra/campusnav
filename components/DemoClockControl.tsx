"use client";

/**
 * DemoClockControl – Floating panel to control the virtual clock during demos.
 *
 * Renders in the bottom-right corner. Collapsible so it doesn't obstruct
 * the main UI. Styled with the app's nebula/indigo theme.
 */

import { useState } from "react";
import { Clock, Pause, Play, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { useVirtualClock } from "@/lib/virtual-clock";

const SPEED_PRESETS = [
    { label: "1×", value: 1 },
    { label: "30×", value: 30 },
    { label: "60×", value: 60 },
    { label: "300×", value: 300 },
];

export default function DemoClockControl() {
    const { now, speed, isPaused, setVirtualTime, setSpeed, pause, resume } =
        useVirtualClock();
    const [collapsed, setCollapsed] = useState(false);

    // Format virtual time for display
    const timeStr = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

    // For the time input
    const [inputTime, setInputTime] = useState("08:50");

    function handleSetTime() {
        const [h, m] = inputTime.split(":").map(Number);
        if (Number.isNaN(h) || Number.isNaN(m)) return;
        const d = new Date(now);
        d.setHours(h, m, 0, 0);
        setVirtualTime(d);
    }

    if (collapsed) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    type="button"
                    onClick={() => setCollapsed(false)}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1e1b5e] to-nebula px-4 py-2.5 text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
                >
                    <Clock size={14} />
                    <span className="text-sm font-bold font-mono">{timeStr}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/20">
                        {speed}×
                    </span>
                    <ChevronUp size={14} />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-72 rounded-2xl border border-indigo-200 bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-[#1e1b5e] to-nebula px-4 py-3">
                <div className="flex items-center gap-2">
                    <Zap size={14} className="text-yellow-300" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Demo Clock
                    </span>
                </div>
                <button type="button" onClick={() => setCollapsed(true)} className="text-white/70 hover:text-white transition-colors">
                    <ChevronDown size={16} />
                </button>
            </div>

            {/* Live clock display */}
            <div className="px-4 pt-4 pb-2 text-center">
                <div className="text-3xl font-extrabold text-gray-900 font-mono tracking-tight">
                    {timeStr}
                </div>
                <div className="mt-1 flex items-center justify-center gap-2">
                    <span
                        className={`inline-block h-2 w-2 rounded-full ${isPaused ? "bg-red-400" : "bg-green-400 animate-pulse"}`}
                    />
                    <span className="text-[11px] text-gray-400 font-medium">
                        {isPaused ? "Paused" : `Running at ${speed}×`}
                    </span>
                </div>
            </div>

            {/* Time input */}
            <div className="px-4 py-2">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Jump to Time
                </label>
                <div className="mt-1 flex gap-2">
                    <input
                        type="time"
                        value={inputTime}
                        onChange={(e) => setInputTime(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-mono text-gray-700 focus:border-nebula focus:outline-none focus:ring-1 focus:ring-nebula"
                    />
                    <button
                        type="button"
                        onClick={handleSetTime}
                        className="rounded-lg bg-nebula px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-nebula-dark"
                    >
                        Set
                    </button>
                </div>
            </div>

            {/* Speed presets */}
            <div className="px-4 py-2">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Speed
                </label>
                <div className="mt-1 grid grid-cols-4 gap-1.5">
                    {SPEED_PRESETS.map((p) => (
                        <button
                            type="button"
                            key={p.value}
                            onClick={() => setSpeed(p.value)}
                            className={`rounded-lg py-1.5 text-xs font-bold transition-all ${speed === p.value
                                    ? "bg-nebula text-white shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pause / Resume */}
            <div className="px-4 pt-1 pb-4">
                <button
                    type="button"
                    onClick={isPaused ? resume : pause}
                    className={`w-full flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all ${isPaused
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    {isPaused ? (
                        <>
                            <Play size={14} /> Resume
                        </>
                    ) : (
                        <>
                            <Pause size={14} /> Pause
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
