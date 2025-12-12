"use client";

import { useRef, useState } from "react";

export default function TeslaSwipeZoom({
  src,
  onSwipeLeft,
  onSwipeRight,
}: {
  src: string;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const [scale, setScale] = useState(1);
  const touchStart = useRef<number | null>(null);

  const handleTouchStart = (e: any) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: any) => {
    if (!touchStart.current) return;
    const diff = e.touches[0].clientX - touchStart.current;
    if (diff > 80) onSwipeRight();
    if (diff < -80) onSwipeLeft();
  };

  return (
    <div
      className="relative touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <img
        src={src}
        alt="zoom"
        className="max-h-[90vh] max-w-[90vw] transition-transform"
        style={{ transform: `scale(${scale})` }}
        onWheel={(e) =>
          setScale((s) => Math.max(1, Math.min(4, s + e.deltaY * -0.002)))
        }
      />
    </div>
  );
}
