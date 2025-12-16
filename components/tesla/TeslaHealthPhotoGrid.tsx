"use client";

import { useState } from "react";

export default function TeslaHealthPhotoGrid({
  photos,
  onChange,
}: {
  photos: (string | null)[];
  onChange: (v: (string | null)[]) => void;
}) {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  async function handleFile(e: any, idx: number) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingIndex(idx);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/uploads/vehicle-health", {
      method: "POST",
      body: form,
    });

    const js = await res.json();
    setLoadingIndex(null);

    if (js.ok) {
      const next = [...photos];
      next[idx] = js.url;
      onChange(next);
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {photos.map((p, i) => (
        <label
          key={i}
          className="border rounded-lg h-24 bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 relative"
        >
          {loadingIndex === i && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm">
              Uploading…
            </div>
          )}

          {p ? (
            <img src={p} className="h-full w-full object-cover rounded-lg" />
          ) : (
            <span className="text-sm text-gray-500">Add Photo</span>
          )}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e, i)}
          />
        </label>
      ))}
    </div>
  );
}
