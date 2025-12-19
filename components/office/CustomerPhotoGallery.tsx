"use client";

import { useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";

type Photo = {
  id: string;
  url: string;
  created_at?: string;
};

export function CustomerPhotoGallery({
  photos,
}: {
  photos: Photo[];
}) {
  const [active, setActive] = useState<Photo | null>(null);

  if (!photos || photos.length === 0) {
    return (
      <TeslaSection label="Customer Photos">
        <div className="text-sm text-gray-400">
          No photos submitted.
        </div>
      </TeslaSection>
    );
  }

  return (
    <TeslaSection label="Customer Photos">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p)}
            className="relative group"
          >
            <img
              src={p.url}
              alt="Customer submission"
              className="h-32 w-full object-cover rounded-lg border"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition" />
          </button>
        ))}
      </div>

      {/* MODAL */}
      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setActive(null)}
        >
          <img
            src={active.url}
            alt="Full size"
            className="max-h-full max-w-full rounded-lg shadow-xl"
          />
        </div>
      )}
    </TeslaSection>
  );
}
