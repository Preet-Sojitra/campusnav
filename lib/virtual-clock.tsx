"use client";

/**
 * VirtualClock – A React context that provides an app-wide virtual clock
 * for demo purposes. Lets you set a custom start time and run at an
 * accelerated speed so time-dependent UI (class statuses, timelines)
 * transitions smoothly during a live demo.
 *
 * Usage:
 *   <VirtualClockProvider>        ← wrap app once
 *     <MyComponent />             ← call useVirtualClock() inside
 *   </VirtualClockProvider>
 */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import type { ClassStatus, ScheduleClass } from "./types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface VirtualClockState {
    /** Current virtual time (updates every tick) */
    now: Date;
    /** Speed multiplier: 1 = real-time, 60 = 1 min/sec, 300 = 5 min/sec */
    speed: number;
    /** Whether the clock is paused */
    isPaused: boolean;
    /** Jump to a specific virtual time */
    setVirtualTime: (date: Date) => void;
    /** Change speed multiplier */
    setSpeed: (multiplier: number) => void;
    /** Pause the virtual clock */
    pause: () => void;
    /** Resume the virtual clock */
    resume: () => void;
}

const VirtualClockContext = createContext<VirtualClockState | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

/** Default: start at 8:50 AM today, running at 60× speed */
const DEFAULT_SPEED = 60;

function makeDefaultStart(): Date {
    const d = new Date();
    d.setHours(8, 50, 0, 0);
    return d;
}

export function VirtualClockProvider({ children }: { children: ReactNode }) {
    // The "anchor" pair: when we started (real) and what virtual time that mapped to.
    const anchorReal = useRef<number>(Date.now());
    const anchorVirtual = useRef<number>(makeDefaultStart().getTime());

    const [speed, setSpeedState] = useState(DEFAULT_SPEED);
    const [isPaused, setIsPaused] = useState(false);
    const [now, setNow] = useState<Date>(makeDefaultStart());

    // Keep refs in sync for the interval callback
    const speedRef = useRef(speed);
    const isPausedRef = useRef(isPaused);
    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);
    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    // Tick loop — update `now` every 100 ms
    useEffect(() => {
        const id = setInterval(() => {
            if (isPausedRef.current) return;

            const elapsed = Date.now() - anchorReal.current;
            const virtualMs = anchorVirtual.current + elapsed * speedRef.current;
            setNow(new Date(virtualMs));
        }, 100);

        return () => clearInterval(id);
    }, []);

    const setVirtualTime = useCallback(
        (date: Date) => {
            anchorReal.current = Date.now();
            anchorVirtual.current = date.getTime();
            setNow(date);
        },
        [],
    );

    const setSpeed = useCallback((m: number) => {
        // Re-anchor so the jump in speed doesn't cause a time jump
        const elapsed = Date.now() - anchorReal.current;
        anchorVirtual.current =
            anchorVirtual.current + elapsed * speedRef.current;
        anchorReal.current = Date.now();
        setSpeedState(m);
    }, []);

    const pause = useCallback(() => {
        // Freeze: re-anchor at current virtual time
        const elapsed = Date.now() - anchorReal.current;
        anchorVirtual.current =
            anchorVirtual.current + elapsed * speedRef.current;
        anchorReal.current = Date.now();
        setIsPaused(true);
    }, []);

    const resume = useCallback(() => {
        anchorReal.current = Date.now();
        setIsPaused(false);
    }, []);

    return (
        <VirtualClockContext.Provider
            value={{ now, speed, isPaused, setVirtualTime, setSpeed, pause, resume }}
        >
            {children}
        </VirtualClockContext.Provider>
    );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useVirtualClock(): VirtualClockState {
    const ctx = useContext(VirtualClockContext);
    if (!ctx)
        throw new Error("useVirtualClock must be inside <VirtualClockProvider>");
    return ctx;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Parse a schedule time string like "9:00 AM" into a Date on the same
 * day as `referenceDate`.
 */
export function parseScheduleTime(
    timeStr: string,
    referenceDate: Date,
): Date {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return referenceDate;

    let hours = Number.parseInt(match[1], 10);
    const minutes = Number.parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();

    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    const d = new Date(referenceDate);
    d.setHours(hours, minutes, 0, 0);
    return d;
}

/**
 * Compute the visual status of a class based on the current virtual time.
 * Returns one of: "completed" | "current" | "upcoming" | "late-afternoon"
 */
export function getClassStatus(
    cls: ScheduleClass,
    virtualNow: Date,
): ClassStatus {
    const start = parseScheduleTime(cls.startTime, virtualNow);
    const end = parseScheduleTime(cls.endTime, virtualNow);

    if (virtualNow >= end) return "completed";
    if (virtualNow >= start && virtualNow < end) return "current";

    // "late-afternoon" for classes starting at or after 2 PM
    if (start.getHours() >= 14) return "late-afternoon";

    return "upcoming";
}
