// components/common/Lightbox.tsx
"use client";

import { useEffect } from "react";

type Img = { url_work: string; alt?: string };

type Props = {
  open: boolean;
  images: Img[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
};

export default function Lightbox({ open, images, index, onClose, onIndex }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex(Math.min(images.length - 1, index + 1));
      if (e.key === "ArrowLeft") onIndex(Math.max(0, index - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, images.length, onClose, onIndex]);

  if (!open) return null;
  if (!images.length) return null;

  const img = images[Math.max(0, Math.min(index, images.length - 1))];

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div className="text-sm text-gray-600">
            {index + 1} / {images.length}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        {/* Image */}
        <div className="bg-black flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url_work}
            alt={img.alt || "photo"}
            className="max-h-[70vh] w-auto object-contain"
            loading="eager"
          />
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-white">
          <button
            onClick={() => onIndex(Math.max(0, index - 1))}
            disabled={index === 0}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            ← Prev
          </button>
          <div className="flex gap-2 overflow-x-auto">
            {images.slice(0, 12).map((m, i) => (
              <button
                key={m.url_work}
                onClick={() => onIndex(i)}
                className={`border rounded-md overflow-hidden ${i === index ? "ring-2 ring-black" : ""}`}
                title={`Go to ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url_work} alt="" className="h-12 w-12 object-cover" loading="lazy" />
              </button>
            ))}
          </div>
          <button
            onClick={() => onIndex(Math.min(images.length - 1, index + 1))}
            disabled={index >= images.length - 1}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
