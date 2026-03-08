"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSchedule } from "./context/ScheduleContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function UploadPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { uploadFile, hasRealData } = useSchedule();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const ACCEPTED_TYPES = ["image/png", "image/jpeg", "application/pdf"];
  const MAX_SIZE = 10 * 1024 * 1024;

  // The hasRealData from useSchedule context already handles checking for cached data.
  // This useEffect and the local hasCachedData state are no longer needed.
  // useEffect(() => {
  //   try {
  //     const cached = localStorage.getItem("nebulalearn-schedule-cache");
  //     if (cached) {
  //       const parsed = JSON.parse(cached);
  //       if (Array.isArray(parsed) && parsed.length > 0) {
  //         setHasCachedData(true);
  //       }
  //     }
  //   } catch {
  //     // ignore
  //   }
  // }, []);

  function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert("Only PNG, JPG, or PDF files are supported.");
      return;
    }
    if (file.size > MAX_SIZE) {
      alert("File must be smaller than 10 MB.");
      return;
    }
    setSelectedFile(file);
    uploadFile(file);
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl text-center">
          {/* Calendar icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-nebula-light">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="5" width="22" height="20" rx="3" stroke="#4338ca" strokeWidth="2" />
              <path d="M3 11H25" stroke="#4338ca" strokeWidth="2" />
              <path d="M9 3V7" stroke="#4338ca" strokeWidth="2" strokeLinecap="round" />
              <path d="M19 3V7" stroke="#4338ca" strokeWidth="2" strokeLinecap="round" />
              <rect x="7" y="14" width="4" height="3" rx="0.5" fill="#4338ca" />
              <rect x="12" y="14" width="4" height="3" rx="0.5" fill="#4338ca" />
              <rect x="17" y="14" width="4" height="3" rx="0.5" fill="#4338ca" />
              <rect x="7" y="19" width="4" height="3" rx="0.5" fill="#4338ca" />
              <rect x="12" y="19" width="4" height="3" rx="0.5" fill="#4338ca" />
            </svg>
          </div>

          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Upload Your Schedule
          </h1>
          <p className="mb-8 text-base text-gray-500">
            Get personalized study spot recommendations between classes
          </p>

          {/* Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            {/* Drag & drop zone */}
            <div
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-colors ${isDragOver
                ? "border-nebula bg-nebula-light/50"
                : "border-gray-300 bg-transparent"
                }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
            >
              {/* Upload cloud icon */}
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mb-3"
              >
                <path
                  d="M12 24C8.68629 24 6 21.3137 6 18C6 15.1911 7.95517 12.8436 10.5699 12.1716C10.524 11.787 10.5 11.3962 10.5 11C10.5 6.85786 13.8579 3.5 18 3.5C22.1421 3.5 25.5 6.85786 25.5 11C25.5 11.3962 25.476 11.787 25.4301 12.1716C28.0448 12.8436 30 15.1911 30 18C30 21.3137 27.3137 24 24 24"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18 18V32M18 18L22 22M18 18L14 22"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {selectedFile ? (
                <>
                  <p className="text-base font-semibold text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-gray-900">
                    Drop your schedule screenshot here
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Supports PNG, JPG, or PDF (Max 10MB)
                  </p>
                </>
              )}

              <button
                type="button"
                className="mt-4 cursor-pointer rounded-lg bg-nebula px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-nebula-dark"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? "Change File" : "Select File"}
              </button>
            </div>

            {/* Continue with cached schedule */}
            {(status === "authenticated" && hasRealData) && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="w-full rounded-lg bg-nebula px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-nebula-dark"
                >
                  Continue with saved schedule →
                </button>
                <p className="mt-2 text-xs text-gray-400">
                  Your last uploaded schedule is saved. Upload a new one above to replace it.
                </p>
              </div>
            )}

            {/* Demo schedule link */}
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => router.push("/dashboard?demo=1")}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-nebula transition-opacity hover:opacity-80"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6.5 5.5L10.5 8L6.5 10.5V5.5Z" fill="currentColor" />
                </svg>
                Try Demo Schedule
              </button>
            </div>
          </div>

          {/* Privacy badge */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-800">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M5 8L7 10L11 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Your data is private and secure
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}