"use client";

/**
 * NearbySpaces – Sidebar card listing empty classrooms nearby.
 *
 * Color conventions:
 *  - UTD Green → AVAILABLE badge (small success indicator)
 *  - Red-500   → BUSY badge
 *  - Nebula    → "Navigate" button and header icon
 *
 * If `emptyRooms` from the API are provided, they replace the static spaces.
 */

import { useState, useCallback } from "react";
import { MapPin, Zap, Wifi, Coffee, Navigation, DoorOpen, ExternalLink, Loader2 } from "lucide-react";
import type { NearbySpace, EmptyRoom } from "@/lib/types";
import { MapEmbed } from "./ScheduleTimeline";
import { resolveRoute } from "@/app/context/ScheduleContext";

const STATUS_STYLE: Record<string, string> = {
    available: "bg-utd-green-light text-utd-green",
    busy: "bg-red-50 text-red-500",
};

const STATUS_LABEL: Record<string, string> = {
    available: "AVAILABLE",
    busy: "BUSY",
};

const AMENITY_ICON: Record<string, React.ReactNode> = {
    "Power available": <Zap size={12} className="text-gray-400" />,
    "High-speed Wifi": <Wifi size={12} className="text-gray-400" />,
    "Cafe nearby": <Coffee size={12} className="text-gray-400" />,
    "Empty classroom": <DoorOpen size={12} className="text-gray-400" />,
};

/** Convert an EmptyRoom from the API into our NearbySpace display format */
function emptyRoomToSpace(room: EmptyRoom, index: number): NearbySpace {
    return {
        id: `empty-${index}-${room.room}`,
        name: room.room,
        building: room.building,
        status: "available",
        amenity: "Empty classroom",
        walkTime: room._walkDurationStr || "Nearby",
        directionsUrl: room._directionsUrl ?? null,
    };
}

function SpaceItem({
    space,
    isSelected,
    onSelect,
    fromRoom,
}: {
    space: NearbySpace;
    isSelected: boolean;
    onSelect: () => void;
    fromRoom: string | null;
}) {
    const [showMap, setShowMap] = useState(false);
    const [mapUrl, setMapUrl] = useState<string | null>(space.directionsUrl ?? null);
    const [isResolving, setIsResolving] = useState(false);

    const handleNavigate = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();

        // If already showing map, just toggle off
        if (showMap) {
            setShowMap(false);
            return;
        }

        // If we already have a URL, show the map
        if (mapUrl) {
            setShowMap(true);
            return;
        }

        // Resolve on-demand using the same fromRoom as GapCard
        if (!fromRoom) return;
        setIsResolving(true);
        try {
            const route = await resolveRoute(fromRoom, space.name);
            if (route.directionsUrl) {
                setMapUrl(route.directionsUrl);
                setShowMap(true);
            }
        } finally {
            setIsResolving(false);
        }
    }, [showMap, mapUrl, fromRoom, space.name]);

    return (
        <div
            className={`py-3.5 border-b border-gray-100 last:border-b-0 cursor-pointer hover:border hover:border-nebula-light hover:border-2 rounded-lg transition-colors ${isSelected ? "bg-nebula-light/60 -mx-2 px-2" : "hover:bg-gray-50 -mx-2 px-2"}`}
            onClick={onSelect}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelect();
            }}
            tabIndex={0}
            role="button"
        >
            {/* Name + badge row */}
            <div className="flex items-start justify-between gap-2">
                <h4 className="text-[13.5px] font-bold text-gray-900 leading-snug">
                    {space.name}
                </h4>
                <span
                    className={`shrink-0 rounded px-2 py-[2px] text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[space.status]}`}
                >
                    {STATUS_LABEL[space.status]}
                </span>
            </div>

            {/* Amenity + walk time */}
            <div className="mt-1.5 flex items-center justify-between text-[11.5px] text-gray-400">
                <span className="flex items-center gap-1">
                    {AMENITY_ICON[space.amenity] ?? <Zap size={12} className="text-gray-400" />}
                    {space.amenity}
                </span>
                <span>{space.walkTime}</span>
            </div>

            {/* Navigate button — slides in when selected */}
            <div
                className={`overflow-hidden transition-all duration-200 ease-out ${isSelected ? "max-h-12 opacity-100 mt-2.5" : "max-h-0 opacity-0 mt-0"}`}
            >
                <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-nebula py-2 text-sm font-semibold text-white transition-colors hover:bg-nebula-dark disabled:opacity-60"
                    onClick={handleNavigate}
                    disabled={isResolving}
                >
                    {isResolving ? (
                        <><Loader2 size={14} className="animate-spin" /> Loading…</>
                    ) : (
                        <><Navigation size={14} /> {showMap ? "Hide Map" : "Navigate"}</>
                    )}
                </button>
            </div>

            {/* Map embed — rendered outside the overflow-hidden container so the iframe isn't clipped */}
            {showMap && mapUrl && (
                <div onClick={(e) => e.stopPropagation()}>
                    <MapEmbed
                        url={mapUrl}
                        onClose={() => setShowMap(false)}
                    />
                </div>
            )}
        </div>
    );
}

interface NearbySpacesProps {
    spaces: NearbySpace[];
    /** Real empty rooms from the API — when present, replaces static demo data */
    emptyRooms?: EmptyRoom[];
    /** The "from" room location (same origin as GapCard) for directions */
    fromRoom?: string | null;
}

export default function NearbySpaces({ spaces, emptyRooms = [], fromRoom = null }: NearbySpacesProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Use real empty rooms if available, otherwise fall back to static data
    const displaySpaces =
        emptyRooms.length > 0
            ? emptyRooms.map((r, i) => emptyRoomToSpace(r, i))
            : spaces;

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-nebula" />
                    <h3 className="text-[15px] font-extrabold text-gray-900">
                        Nearby Empty Classes
                    </h3>
                </div>
                {emptyRooms.length > 0 && (
                    <span className="text-[10px] font-bold text-utd-green bg-utd-green-light rounded px-2 py-0.5">
                        LIVE
                    </span>
                )}
            </div>

            {/* Space list */}
            <div>
                {displaySpaces.map((space) => (
                    <SpaceItem
                        key={space.id}
                        space={space}
                        isSelected={selectedId === space.id}
                        onSelect={() =>
                            setSelectedId(selectedId === space.id ? null : space.id)
                        }
                        fromRoom={fromRoom}
                    />
                ))}
            </div>
        </div>
    );
}

