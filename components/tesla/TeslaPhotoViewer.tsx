"use client";

import { useEffect, useState } from "react";
import TeslaSwipeZoom from "./TeslaSwipeZoom";
import { X } from "lucide-react";

export default function TeslaPhotoViewer({
  photos,
  index,
  onClose,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);

  // ESC support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const next = () =>
    setCurrent((c) => (c < photos.length - 1 ? c + 1 : c));
  const prev = () => setCurrent((c) => (c > 0 ? c - 1 : c));

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* CLOSE BUTTON */}
      <button
        className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition"
        onClick={onClose}
      >
        <X size={24} />
      </button>

      {/* IMAGE */}
      <div className="flex-1 flex items-center justify-center">
        <TeslaSwipeZoom
          src={photos[current]}
          onSwipeLeft={next}
          onSwipeRight={prev}
        />
      </div>

      {/* THUMBNAILS */}
      <div className="flex overflow-x-auto space-x-3 py-4 px-4 bg-black/40">
        {photos.map((url, i) => (
          <img
            key={i}
            src={url}
            onClick={() => setCurrent(i)}
            className={`h-16 w-16 object-cover rounded-md cursor-pointer border ${
              i === current
                ? "border-red-500 scale-110"
                : "border-white/20"
            } transition`}
          />
        ))}
      </div>
    </div>
  );
}
