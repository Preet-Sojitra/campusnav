/**
 * CampusTransit – Sidebar card showing next campus shuttle info.
 *
 * Color conventions:
 *  - Nebula indigo → header icon and accent
 *  - Arrival time displayed in nebula blue for emphasis
 */

import Image from "next/image";
import { Bus, Map as MapIcon } from "lucide-react";
import type { CampusTransit as CampusTransitType } from "@/lib/types";

interface CampusTransitProps {
    transit: CampusTransitType[];
}

export default function CampusTransit({ transit }: CampusTransitProps) {
    const shuttle = transit[0];
    if (!shuttle) return null;

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Bus size={16} className="text-nebula" />
                <h3 className="text-[15px] font-extrabold text-gray-900">
                    Campus Transit
                </h3>
            </div>

            {/* Map placeholder */}
            <div className="relative mb-3 h-[120px] overflow-hidden rounded-lg bg-gray-100">
                <Image src="/map.jpg" alt="Campus map" fill className="object-cover" />
                {/* Shuttle label overlay */}
                <div className="absolute bottom-2 left-2 right-2 rounded-md bg-white/90 backdrop-blur-sm px-3 py-1.5 shadow-sm">
                    <p className="text-[11px] font-semibold text-gray-700 truncate">
                        {shuttle.shuttleLabel}
                    </p>
                </div>
            </div>

            {/* Next shuttle info */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[13px] font-bold text-gray-900">Next Shuttle</p>
                    <p className="text-[12px] text-gray-400">{shuttle.routeName}</p>
                </div>
                <span className="text-[15px] font-bold text-nebula">
                    {shuttle.nextArrival}
                </span>
            </div>
        </div>
    );
}
