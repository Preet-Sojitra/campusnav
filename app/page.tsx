"use client"

import { useState, useRef } from "react";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

  const ACCEPTED_TYPES = ["image/png", "image/jpeg", "application/pdf"];
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

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
    setUploadStatus("idle");
    uploadFile(file);
  }

  async function uploadFile(file: File) {
    setUploadStatus("uploading");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      console.log("Upload response:", data);
      setUploadStatus("success");
    } catch (err) {
      console.error(err);
      setUploadStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-bg-page font-sans">
      {/* ─── Navbar ─── */}
      <nav
        className="flex items-center justify-between border-b px-6 py-3"
        style={{
          backgroundColor: "var(--color-navbar-bg)",
          borderColor: "var(--color-navbar-border)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
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
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="text-sm font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Help
          </a>
          {/* User avatar icon */}
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

      {/* ─── Main Content ─── */}
      <main className="mx-auto max-w-xl px-4 py-10 text-center">
        {/* Calendar icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--color-icon-bg)" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
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
            <rect x="7" y="14" width="4" height="3" rx="0.5" fill="var(--color-icon-text)" />
            <rect x="12" y="14" width="4" height="3" rx="0.5" fill="var(--color-icon-text)" />
            <rect x="17" y="14" width="4" height="3" rx="0.5" fill="var(--color-icon-text)" />
            <rect x="7" y="19" width="4" height="3" rx="0.5" fill="var(--color-icon-text)" />
            <rect x="12" y="19" width="4" height="3" rx="0.5" fill="var(--color-icon-text)" />
          </svg>
        </div>

        {/* Title & subtitle */}
        <h1
          className="mb-2 text-3xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Upload Your Schedule
        </h1>
        <p
          className="mb-8 text-base"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Get personalized study spot recommendations between classes
        </p>

        {/* ─── Card ─── */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "var(--color-bg-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
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
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-colors"
            style={{
              borderColor: isDragOver
                ? "var(--color-primary)"
                : "var(--color-border-dashed)",
              backgroundColor: isDragOver
                ? "var(--color-primary-light)"
                : "transparent",
            }}
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
                stroke="var(--color-text-muted)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18 18V32M18 18L22 22M18 18L14 22"
                stroke="var(--color-text-muted)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {selectedFile ? (
              <>
                <p
                  className="text-base font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {selectedFile.name}
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {(selectedFile.size / 1024).toFixed(1)} KB
                  {uploadStatus === "uploading" && " · Uploading…"}
                  {uploadStatus === "success" && " · ✓ Uploaded"}
                  {uploadStatus === "error" && " · ✗ Failed"}
                </p>
              </>
            ) : (
              <>
                <p
                  className="text-base font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Drop your schedule screenshot here
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Supports PNG, JPG, or PDF (Max 10MB)
                </p>
              </>
            )}

            <button
              type="button"
              className="mt-4 cursor-pointer rounded-md px-5 py-2 text-sm font-semibold text-white transition-colors"
              style={{
                backgroundColor: "var(--color-primary)",
              }}
              onClick={() => fileInputRef.current?.click()}
              onMouseOver={(e) =>
              ((e.target as HTMLElement).style.backgroundColor =
                "var(--color-primary-hover)")
              }
              onMouseOut={(e) =>
              ((e.target as HTMLElement).style.backgroundColor =
                "var(--color-primary)")
              }
            >
              {selectedFile ? "Change File" : "Select File"}
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div
              className="h-px flex-1"
              style={{ backgroundColor: "var(--color-border)" }}
            />
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--color-divider-text)" }}
            >
              Or Paste Manually
            </span>
            <div
              className="h-px flex-1"
              style={{ backgroundColor: "var(--color-border)" }}
            />
          </div>

          {/* Textarea */}
          <div className="text-left">
            <label
              className="mb-2 block text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
              htmlFor="courseList"
            >
              Copy and paste your course list
            </label>
            <textarea
              id="courseList"
              rows={4}
              placeholder="CS 2305 - Mon/Wed 9:00 AM - 10:15 AM - ECSS 2.412"
              className="w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
                backgroundColor: "var(--color-bg-card)",
                // @ts-ignore
                "--tw-ring-color": "var(--color-primary)",
              }}
            />
          </div>

          {/* Try Demo Schedule link */}
          <div className="mt-4 flex justify-center">
            <a
              href="#"
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: "var(--color-primary)" }}
            >
              {/* Play icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M6.5 5.5L10.5 8L6.5 10.5V5.5Z"
                  fill="currentColor"
                />
              </svg>
              Try Demo Schedule
            </a>
          </div>

          {/* CTA Button */}
          <button
            type="button"
            className="mt-6 w-full cursor-pointer py-3.5 text-base font-semibold text-white transition-colors"
            style={{
              backgroundColor: "var(--color-primary)",
              borderRadius: "var(--radius-btn)",
            }}
            onMouseOver={(e) =>
            ((e.target as HTMLElement).style.backgroundColor =
              "var(--color-primary-hover)")
            }
            onMouseOut={(e) =>
            ((e.target as HTMLElement).style.backgroundColor =
              "var(--color-primary)")
            }
          >
            Generate My Schedule →
          </button>

          {/* Already have a schedule */}
          <p
            className="mt-3 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Already have a schedule?{" "}
            <a
              href="#"
              className="font-medium underline"
              style={{ color: "var(--color-primary)" }}
            >
              View it here
            </a>
          </p>
        </div>

        {/* ─── Privacy Badge ─── */}
        <div className="mt-8 flex justify-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: "var(--color-badge-bg)",
              borderColor: "var(--color-badge-border)",
              color: "var(--color-badge-text)",
            }}
          >
            {/* Shield / check icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="8"
                cy="8"
                r="7"
                stroke="currentColor"
                strokeWidth="1.5"
              />
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

        {/* ─── Trusted By ─── */}
        <div className="mt-6 mb-12 text-center">
          <p
            className="mb-2 text-xs font-semibold tracking-widest uppercase"
            style={{ color: "var(--color-text-muted)" }}
          >
            Trusted By
          </p>
          <div className="flex items-center justify-center gap-2">
            {/* UT Dallas colour block */}
            <div
              className="h-5 w-5 rounded"
              style={{ backgroundColor: "var(--color-primary)" }}
            />
            <span
              className="text-sm font-bold tracking-wide uppercase"
              style={{ color: "var(--color-text-primary)" }}
            >
              UT Dallas
            </span>
          </div>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Used by 5,000+ UTD students
          </p>
        </div>
      </main>
    </div>
  );
}
