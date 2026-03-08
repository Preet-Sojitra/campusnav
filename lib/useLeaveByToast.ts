"use client";

/**
 * useLeaveByToast – Fires a react-hot-toast notification when the virtual
 * clock passes a class's `leaveByTime`. Each class only fires once per
 * session / day selection.
 */

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import type { ScheduleClass } from "./types";
import { parseScheduleTime } from "./virtual-clock";

export function useLeaveByToast(
    classes: ScheduleClass[],
    virtualNow: Date,
) {
    // Track which class IDs have already fired a toast
    const firedRef = useRef<Set<string>>(new Set());

    // Reset fired set when the class list changes (e.g. day switch)
    const classIdsKey = classes.map((c) => c.id).join(",");
    useEffect(() => {
        firedRef.current = new Set();
    }, [classIdsKey]);

    // Check on every virtual-clock tick
    useEffect(() => {
        for (let i = 0; i < classes.length; i++) {
            const cls = classes[i];
            if (!cls.leaveByTime) continue;
            if (firedRef.current.has(cls.id)) continue;

            const leaveBy = parseScheduleTime(cls.leaveByTime, virtualNow);
            if (virtualNow >= leaveBy) {
                firedRef.current.add(cls.id);

                // Determine the next class name for the message
                const nextCls = classes[i + 1];
                const destination = nextCls
                    ? `${nextCls.courseCode}`
                    : "your next class";

                toast(`Time to leave for ${destination}! 🚶`, {
                    icon: "⏰",
                    style: {
                        background: "#FFF7ED",
                        border: "1px solid #F97316",
                        color: "#9A3412",
                    },
                });
            }
        }
    }, [classes, virtualNow]);
}
