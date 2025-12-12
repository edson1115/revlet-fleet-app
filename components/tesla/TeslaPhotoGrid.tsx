"use client";

import { useState } from "react";
import TeslaPhotoViewer from "./TeslaPhotoViewer";

export default function TeslaPhotoGrid({ photos }: { photos: string[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <>
      {/* GRID */}
      <div className="grid grid-cols-3 gap-3 p-4">
        {photos.map((url, i) => (
          <div
            key={i}
            className="relative cursor-pointer rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
            onClick={() => setActiveIndex(i)}
          >
            <img
              src={url}
              className="object-cover w-full h-24"
              alt="vehicle photo"
            />
          </div>
        ))}
      </div>

      {/* FULLSCREEN VIEWER */}
      {activeIndex !== null && (
        <TeslaPhotoViewer
          photos={photos}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </>
  );
}
