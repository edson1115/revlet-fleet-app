"use client";

import { useState, useRef } from "react";

export default function TeslaBeforeAfter({
  before,
  after,
}: {
  before: string;
  after: string;
}) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement | null>(null);

  const updatePos = (clientX: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, x)));
  };

  const handleDown = (e: any) => {
    e.preventDefault();
    const move = (ev: any) => updatePos(ev.touches?.[0]?.clientX ?? ev.clientX);
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-6">
      <div
        ref={ref}
        className="relative w-full overflow-hidden rounded-xl shadow-lg bg-black"
        onMouseDown={handleDown}
        onTouchStart={handleDown}
      >
        <img
          src={before}
          className="absolute inset-0 object-cover w-full h-full"
        />

        <img
          src={after}
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          className="absolute inset-0 object-cover w-full h-full"
        />

        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-xl cursor-col-resize"
          style={{ left: `${pos}%` }}
        />

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 text-white text-xs"
        >
          Drag to compare
        </div>
      </div>
    </div>
  );
}
