"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

const SNAP_MINUTES = 15;

function snapToInterval(minutes: number) {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export default function TimelineInteractive({
  startHour = 6,
  endHour = 20,
  onChange,
}: {
  startHour?: number;
  endHour?: number;
  onChange?: (range: { start: string; end: string }) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number | null>(null);

  const totalMinutes = (endHour - startHour) * 60;

  // Convert a pixel position into a time
  const pxToTime = (px: number) => {
    if (!containerRef.current) return startHour * 60;
    const rect = containerRef.current.getBoundingClientRect();
    const clamped = Math.max(rect.left, Math.min(px, rect.right));
    const pct = (clamped - rect.left) / rect.width;
    const minutes = Math.floor(pct * totalMinutes);
    return startHour * 60 + snapToInterval(minutes);
  };

  // Format minutes → HH:MM
  const fmt = (m: number) => {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}:${mm.toString().padStart(2, "0")}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    setCurrentX(e.clientX);
  };

  const handleMouseUp = () => {
    if (!dragging || !startX || !currentX) {
      setDragging(false);
      return;
    }
    setDragging(false);

    const start = pxToTime(Math.min(startX, currentX));
    const end = pxToTime(Math.max(startX, currentX));

    if (onChange) {
      onChange({ start: fmt(start), end: fmt(end) });
    }
  };

  // Event listeners for dragging
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  // Computed UI block positions
  const blockData = (() => {
    if (!dragging || !startX || !currentX || !containerRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const leftPx = Math.min(startX, currentX) - rect.left;
    const rightPx = Math.max(startX, currentX) - rect.left;

    return {
      left: Math.max(0, leftPx),
      width: Math.max(2, rightPx - leftPx),
    };
  })();

  return (
    <div className="w-full select-none">
      {/* LABEL */}
      <div className="text-xs text-gray-500 mb-2 pl-1 tracking-wide">
        Select a service time
      </div>

      {/* TIMELINE BODY */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className="
          relative w-full h-16 bg-[#F5F5F5]
          rounded-xl shadow-inner cursor-pointer
        "
      >
        {/* Hour ticks */}
        <div className="absolute w-full h-full flex justify-between px-2 items-end pb-1">
          {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
            const hour = startHour + i;
            return (
              <div key={hour} className="flex flex-col items-center">
                <div className="w-[1px] h-4 bg-gray-400 mb-1" />
                <span className="text-[10px] text-gray-500">{hour}:00</span>
              </div>
            );
          })}
        </div>

        {/* SELECTION BLOCK */}
        {blockData && (
          <motion.div
            className="
              absolute top-1/2 -translate-y-1/2 h-8
              bg-[#80FF44]/40
              rounded-lg border border-[#80FF44]
            "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            style={{
              left: blockData.left,
              width: blockData.width,
            }}
          />
        )}
      </div>

      {/* LIVE READOUT */}
      {dragging && blockData && (
        <div className="mt-3 text-sm text-gray-700 flex justify-between">
          <span>
            Start:{" "}
            <b>
              {fmt(pxToTime(Math.min(startX!, currentX!)))}
            </b>
          </span>
          <span>
            End:{" "}
            <b>
              {fmt(pxToTime(Math.max(startX!, currentX!)))}
            </b>
          </span>
        </div>
      )}
    </div>
  );
}
