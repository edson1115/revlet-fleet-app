"use client";
import { useState } from "react";

export function PhotoDropzone({
  requestId,
  onUploaded,
  kind = "other",
}: {
  requestId: string;
  onUploaded: () => void;
  kind?: "before" | "after" | "other";
}) {
  const [hover, setHover] = useState(false);

  async function uploadFiles(files: FileList) {
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);

      await fetch(`/api/requests/${requestId}/photos`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
    }
    onUploaded();
  }

  return (
    <div
      className={`border-dashed border-2 rounded-xl p-6 text-center ${
        hover ? "border-blue-500 bg-blue-50" : "border-gray-300"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        if (e.dataTransfer.files.length) {
          uploadFiles(e.dataTransfer.files);
        }
      }}
    >
      <div className="text-sm text-gray-600">
        Drag & drop to upload photos ({kind})
      </div>
    </div>
  );
}
