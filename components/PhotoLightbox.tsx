"use client";

import { useEffect } from "react";

export function PhotoLightbox({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!url) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      <img
        src={url}
        className="max-h-[90%] max-w-[90%] object-contain shadow-2xl rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
