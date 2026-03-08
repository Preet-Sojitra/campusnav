"use client";

import { useState } from "react";
import { useSchedule } from "../context/ScheduleContext";
import Link from "next/link";

export default function DashboardPage() {
    const { classes, routes, isLoading, error } = useSchedule();

    /* ─── Loading State ─── */
    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg-page font-sans">
                <Nav />
                <main className="mx-auto max-w-2xl px-4 py-16 text-center">
                    <div
                        className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl"
                        style={{ backgroundColor: "var(--color-icon-bg)" }}
                    >
                        <svg
                            className="animate-spin"
                            width="28"
                            height="28"
                            viewBox="0 0 28 28"
                            fill="none"
                        >
                            <circle
                                cx="14"
                                cy="14"
                                r="12"
                                stroke="var(--color-border)"
                                strokeWidth="2.5"
                            />
                            <path
                                d="M14 2A12 12 0 0 1 26 14"
                                stroke="var(--color-primary)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                    <h2
                        className="text-xl font-bold"
                        style={{ color: "var(--color-text-primary)" }}
                    >
                        <span className="loading-ellipsis">Analyzing your schedule</span>
                    </h2>
                    <p
                        className="mt-2 text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        Extracting classes and finding the best routes…
                    </p>
                    <div
                        className="mx-auto mt-6 h-1.5 w-48 overflow-hidden rounded-full"
                        style={{ backgroundColor: "var(--color-border)" }}
                    >
                        <div
                            className="loading-progress-bar h-full rounded-full"
                            style={{ backgroundColor: "var(--color-primary)" }}
                        />
                    </div>
                </main>
            </div>
        );
    }

    /* ─── Error State ─── */
    if (error) {
        return (
            <div className="min-h-screen bg-bg-page font-sans">
                <Nav />
                <main className="mx-auto max-w-2xl px-4 py-16 text-center">
                    <div
                        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
                        style={{ backgroundColor: "#fef2f2" }}
                    >
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <circle cx="14" cy="14" r="12" stroke="#ef4444" strokeWidth="2" />
                            <path
                                d="M14 9V15M14 19H14.01"
                                stroke="#ef4444"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                    <h2
                        className="text-xl font-bold"
                        style={{ color: "var(--color-text-primary)" }}
                    >
                        Something went wrong
                    </h2>
                    <p
                        className="mt-2 text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        {error}
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-colors"
                        style={{ backgroundColor: "var(--color-primary)" }}
                    >
                        ← Try Again
                    </Link>
                </main>
            </div>
        );
    }

    /* ─── Empty State ─── */
    if (classes.length === 0) {
        return (
            <div className="min-h-screen bg-bg-page font-sans">
                <Nav />
                <main className="mx-auto max-w-2xl px-4 py-16 text-center">
                    <div
                        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
                        style={{ backgroundColor: "var(--color-icon-bg)" }}
                    >
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect
                                x="3"
                                y="5"
                                width="22"
                                height="20"
                                rx="3"
                                stroke="var(--color-icon-text)"
                                strokeWidth="2"
                            />
                            <path d="M3 11H25" stroke="var(--color-icon-text)" strokeWidth="2" />
                            <path d="M9 3V7" stroke="var(--color-icon-text)" strokeWidth="2" strokeLinecap="round" />
                            <path d="M19 3V7" stroke="var(--color-icon-text)" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h2
                        className="text-xl font-bold"
                        style={{ color: "var(--color-text-primary)" }}
                    >
                        No schedule uploaded yet
                    </h2>
                    <p
                        className="mt-2 text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        Upload your schedule to see directions between your classes.
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-colors"
                        style={{ backgroundColor: "var(--color-primary)" }}
                    >
                        ← Upload Schedule
                    </Link>
                </main>
            </div>
        );
    }

    /* ─── Main: Route Cards ─── */
    const routesLoading = routes.some((r) => r.loading);

    return (
        <div className="min-h-screen bg-bg-page font-sans">
            <Nav />

            <main className="mx-auto max-w-2xl px-4 py-10">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1
                        className="text-2xl font-bold"
                        style={{ color: "var(--color-text-primary)" }}
                    >
                        Your Class Routes
                    </h1>
                    <p
                        className="mt-1 text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        {classes.length} classes found · {routes.length} route
                        {routes.length !== 1 ? "s" : ""} between consecutive classes
                        {routesLoading && " · Resolving…"}
                    </p>
                </div>

                {/* ─── Classes Summary ─── */}
                <section className="mb-8">
                    <h2
                        className="mb-3 text-sm font-semibold tracking-wide uppercase"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        Classes
                    </h2>
                    <div
                        className="overflow-hidden rounded-xl"
                        style={{
                            backgroundColor: "var(--color-bg-card)",
                            boxShadow: "var(--shadow-card)",
                        }}
                    >
                        {classes.map((c, i) => (
                            <div
                                key={`${c.day}-${c.courseCode}-${c.startTime}-${i}`}
                                className="flex items-center gap-4 px-5 py-3"
                                style={{
                                    borderBottom:
                                        i < classes.length - 1
                                            ? "1px solid var(--color-border)"
                                            : "none",
                                }}
                            >
                                {/* Day badge */}
                                <span
                                    className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold"
                                    style={{
                                        backgroundColor: "var(--color-primary-light)",
                                        color: "var(--color-primary)",
                                    }}
                                >
                                    {c.day}
                                </span>
                                {/* Course info */}
                                <div className="min-w-0 flex-1">
                                    <p
                                        className="truncate text-sm font-semibold"
                                        style={{ color: "var(--color-text-primary)" }}
                                    >
                                        {c.courseCode}
                                        {c.courseName ? ` — ${c.courseName}` : ""}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{ color: "var(--color-text-secondary)" }}
                                    >
                                        {c.startTime} · {c.room}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─── Route Cards ─── */}
                {routes.length > 0 && (
                    <section>
                        <h2
                            className="mb-3 text-sm font-semibold tracking-wide uppercase"
                            style={{ color: "var(--color-text-muted)" }}
                        >
                            Directions
                        </h2>
                        <div className="flex flex-col gap-4">
                            {routes.map((route, i) => (
                                <RouteCard key={i} route={route} />
                            ))}
                        </div>
                    </section>
                )}

                {routes.length === 0 && classes.length > 0 && (
                    <p
                        className="mt-4 text-center text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        No consecutive class pairs found on the same day.
                    </p>
                )}

                {/* Back link */}
                <div className="mt-10 text-center">
                    <Link
                        href="/"
                        className="text-sm font-semibold transition-opacity hover:opacity-80"
                        style={{ color: "var(--color-primary)" }}
                    >
                        ← Upload a different schedule
                    </Link>
                </div>
            </main>
        </div>
    );
}

/* ───────────────────────────── Route Card ───────────────────────────── */

function RouteCard({ route }: { route: import("../context/ScheduleContext").RouteEntry }) {
    const { from, to, directionsUrl, formattedDuration, loading, error } = route;
    const [showMap, setShowMap] = useState(false);

    return (
        <div
            className="rounded-xl p-5 transition-shadow hover:shadow-md"
            style={{
                backgroundColor: "var(--color-bg-card)",
                boxShadow: "var(--shadow-card)",
            }}
        >
            {/* From → To row */}
            <div className="flex items-center gap-3">
                {/* FROM */}
                <div className="min-w-0 flex-1">
                    <p
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        From
                    </p>
                    <p
                        className="mt-0.5 truncate text-sm font-bold"
                        style={{ color: "var(--color-text-primary)" }}
                    >
                        {from.room}
                    </p>
                    <p
                        className="text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        {from.courseCode} · {from.startTime}
                    </p>
                </div>

                {/* Arrow */}
                <div className="shrink-0">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <path
                            d="M6 14H22M22 14L16 8M22 14L16 20"
                            stroke="var(--color-primary)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                {/* TO */}
                <div className="min-w-0 flex-1 text-right">
                    <p
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        To
                    </p>
                    <p
                        className="mt-0.5 truncate text-sm font-bold"
                        style={{ color: "var(--color-text-primary)" }}
                    >
                        {to.room}
                    </p>
                    <p
                        className="text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        {to.courseCode} · {to.startTime}
                    </p>
                </div>
            </div>

            {/* Walking duration badge */}
            {formattedDuration && (
                <div
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold"
                    style={{
                        backgroundColor: "var(--color-primary-light)",
                        color: "var(--color-primary)",
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M7 4V7.5L9.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    🚶 {formattedDuration} walk
                </div>
            )}

            {/* Action */}
            <div className="mt-4">
                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-2">
                        <svg
                            className="animate-spin"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <circle
                                cx="8"
                                cy="8"
                                r="6"
                                stroke="var(--color-border)"
                                strokeWidth="2"
                            />
                            <path
                                d="M8 2A6 6 0 0 1 14 8"
                                stroke="var(--color-primary)"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                        <span
                            className="text-xs font-medium"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            Resolving route…
                        </span>
                    </div>
                ) : error ? (
                    <p
                        className="rounded-lg px-4 py-2 text-center text-xs font-medium"
                        style={{ backgroundColor: "#fef2f2", color: "#ef4444" }}
                    >
                        Could not resolve route — {error}
                    </p>
                ) : directionsUrl ? (
                    <>
                        <button
                            onClick={() => setShowMap((v) => !v)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors"
                            style={{ backgroundColor: "var(--color-primary)" }}
                            onMouseOver={(e) =>
                            ((e.currentTarget as HTMLElement).style.backgroundColor =
                                "var(--color-primary-hover)")
                            }
                            onMouseOut={(e) =>
                            ((e.currentTarget as HTMLElement).style.backgroundColor =
                                "var(--color-primary)")
                            }
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path
                                    d="M8 1C4.686 1 2 3.686 2 7C2 11.5 8 15 8 15C8 15 14 11.5 14 7C14 3.686 11.314 1 8 1Z"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    strokeLinejoin="round"
                                />
                                <circle cx="8" cy="7" r="2" stroke="white" strokeWidth="1.5" />
                            </svg>
                            {showMap ? "Hide Map" : "Show Map"}
                        </button>

                        {showMap && (
                            <div className="mt-3 overflow-hidden rounded-lg" style={{ border: "1px solid var(--color-border)" }}>
                                <iframe
                                    src={directionsUrl}
                                    title="Campus Map Directions"
                                    className="w-full border-0"
                                    style={{ height: "400px" }}
                                    allow="geolocation"
                                />
                            </div>
                        )}

                        <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center justify-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
                            style={{ color: "var(--color-primary)" }}
                        >
                            Open in new tab ↗
                        </a>
                    </>
                ) : (
                    <p
                        className="rounded-lg px-4 py-2 text-center text-xs font-medium"
                        style={{
                            backgroundColor: "var(--color-primary-light)",
                            color: "var(--color-text-secondary)",
                        }}
                    >
                        Room not found on campus map
                    </p>
                )}
            </div>
        </div>
    );
}

/* ───────────────────────────── Shared Nav ───────────────────────────── */

function Nav() {
    return (
        <nav
            className="flex items-center justify-between border-b px-6 py-3"
            style={{
                backgroundColor: "var(--color-navbar-bg)",
                borderColor: "var(--color-navbar-border)",
            }}
        >
            <Link href="/" className="flex items-center gap-2 no-underline">
                <svg
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect width="28" height="28" rx="6" fill="var(--color-primary)" />
                    <path
                        d="M8 10L14 7L20 10V18L14 21L8 18V10Z"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M14 14L20 10M14 14L8 10M14 14V21"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />
                </svg>
                <span
                    className="text-lg font-bold"
                    style={{ color: "var(--color-primary)" }}
                >
                    NebulaLearn
                </span>
            </Link>

            <div className="flex items-center gap-4">
                <Link
                    href="/"
                    className="text-sm font-medium no-underline"
                    style={{ color: "var(--color-text-secondary)" }}
                >
                    Upload
                </Link>
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle
                        cx="16"
                        cy="16"
                        r="15"
                        stroke="var(--color-border)"
                        strokeWidth="1.5"
                        fill="var(--color-bg-card)"
                    />
                    <circle cx="16" cy="13" r="4" fill="var(--color-primary)" />
                    <path
                        d="M8 25C8 21 11.5 18 16 18C20.5 18 24 21 24 25"
                        stroke="var(--color-primary)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
        </nav>
    );
}
