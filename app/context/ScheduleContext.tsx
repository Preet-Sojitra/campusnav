"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from "react";

export interface ClassEntry {
    day: string;
    courseCode: string;
    courseName: string;
    startTime: string;
    room: string;
}

interface ScheduleState {
    classes: ClassEntry[];
    isLoading: boolean;
    error: string | null;
    uploadFile: (file: File) => void;
}

const ScheduleContext = createContext<ScheduleState | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
    const [classes, setClasses] = useState<ClassEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = useCallback((file: File) => {
        setIsLoading(true);
        setError(null);
        setClasses([]);

        const formData = new FormData();
        formData.append("file", file);

        fetch("/api/upload", { method: "POST", body: formData })
            .then(async (res) => {
                if (!res.ok) throw new Error("Upload failed");
                const data = await res.json();

                // The API returns schedule as a JSON string — parse it
                let parsed = data.schedule;
                if (typeof parsed === "string") {
                    // Strip markdown code fences if present
                    parsed = parsed.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
                    parsed = JSON.parse(parsed);
                }

                setClasses(parsed.classes ?? []);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Schedule parse error:", err);
                setError("Failed to parse schedule. Please try again.");
                setIsLoading(false);
            });
    }, []);

    return (
        <ScheduleContext.Provider value={{ classes, isLoading, error, uploadFile }}>
            {children}
        </ScheduleContext.Provider>
    );
}

export function useSchedule() {
    const ctx = useContext(ScheduleContext);
    if (!ctx) throw new Error("useSchedule must be used within ScheduleProvider");
    return ctx;
}
