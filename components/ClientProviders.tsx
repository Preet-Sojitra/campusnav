"use client";

/**
 * ClientProviders – Client-side wrapper that provides the VirtualClock
 * context, ScheduleContext, and renders the floating demo clock control.
 * Separated from layout.tsx so the layout can remain a server component
 * (required for Next.js metadata export).
 */

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { VirtualClockProvider } from "@/lib/virtual-clock";
import { ScheduleProvider } from "@/app/context/ScheduleContext";
import DemoClockControl from "@/components/DemoClockControl";
import { usePathname } from "next/navigation";
import AskGemini from "@/components/AskGemini";
import { SessionProvider } from "next-auth/react";

export default function ClientProviders({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isDashboardActive = pathname === "/dashboard";

    return (
        <SessionProvider>
            <ScheduleProvider isDashboardActive={isDashboardActive}>
                <VirtualClockProvider>
                    {children}
                    <DemoClockControl />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 8000,
                            style: {
                                borderRadius: "12px",
                                padding: "14px 18px",
                                fontSize: "14px",
                                fontWeight: 600,
                                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                            },
                        }}
                    />
                    <AskGemini />
                </VirtualClockProvider>
            </ScheduleProvider>
        </SessionProvider>
    );
}
