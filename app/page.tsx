"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  async function sendImage() {
    console.log("Send button clicked");

    if (!file) {
      alert("Please choose an image first");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/parseSchedule", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("Response:", data);
    alert(JSON.stringify(data, null, 2));
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Upload Schedule Image</h1>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            console.log("Selected file:", e.target.files[0].name);
          }
        }}
      />

      <br />
      <br />

      <button
        type="button"
        onClick={sendImage}
        style={{
          padding: "10px 16px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Send Image
      </button>
    </div>
  );
}