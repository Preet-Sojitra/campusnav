"use client";

/**
 * ClientProviders – Client-side wrapper that provides the VirtualClock
 * context, ScheduleContext, and renders the floating demo clock control.
 * Separated from layout.tsx so the layout can remain a server component
 * (required for Next.js metadata export).
 */

import type { ReactNode } from "react";
import { VirtualClockProvider } from "@/lib/virtual-clock";
import { ScheduleProvider } from "@/app/context/ScheduleContext";
import DemoClockControl from "@/components/DemoClockControl";

export default function ClientProviders({ children }: { children: ReactNode }) {
    return (
        <ScheduleProvider>
            <VirtualClockProvider>
                {children}
                <DemoClockControl />
            </VirtualClockProvider>
        </ScheduleProvider>
    );
}
