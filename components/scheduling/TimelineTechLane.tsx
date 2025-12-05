"use client";

import React, { useState } from "react";
import { snapTo30 } from "./useTimeline";

function minutesSinceMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function minutesToLeftPx(min: number) {
  return (min / 1440) * 100; // percent
}

export default function TimelineTechLane({
  tech,
  blocks,
  now,
  onSelect,
}: {
  tech: any;
  blocks: any[];
  now: number;
  onSelect: (range: { start: string; end: string }) => void;
}) {
  const [drag, setDrag] = useState<{ start: number; end: number } | null>(
    null
  );

  function handleMouseDown(e: React.MouseEvent) {
    const x = e.nativeEvent.offsetX;
    const percent = x / e.currentTarget.clientWidth;
    const mins = Math.floor(percent * 1440);
    setDrag({ start: mins, end: mins });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!drag) return;
    const x = e.nativeEvent.offsetX;
    const percent = x / e.currentTarget.clientWidth;
    const mins = Math.floor(percent * 1440);
    setDrag((d) => ({ start: d!.start, end: mins }));
  }

  function handleMouseUp() {
    if (!drag) return;
    const s = snapTo30(drag.start);
    const e = snapTo30(drag.end);
    const start = Math.min(s, e);
    const end = Math.max(s, e);

    const today = new Date();
    const isoStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      Math.floor(start / 60),
      start % 60
    ).toISOString();

    const isoEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      Math.floor(end / 60),
      end % 60
    ).toISOString();

    onSelect({ start: isoStart, end: isoEnd });
    setDrag(null);
  }

  const nowMin = minutesSinceMidnight(new Date(now));

  return (
    <div className="py-4 relative">
      <div className="mb-2 text-sm font-medium">{tech.full_name}</div>

      {/* Background grid */}
      <div
        className="h-10 bg-gray-100 rounded relative cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Now line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500"
          style={{ left: `${minutesToLeftPx(nowMin)}%` }}
        />

        {/* Busy blocks */}
        {blocks.map((b) => {
          const s = minutesSinceMidnight(new Date(b.start_at));
          const e = minutesSinceMidnight(new Date(b.end_at));
          return (
            <div
              key={b.id}
              className="absolute top-1 bottom-1 bg-gray-400/40 rounded"
              style={{
                left: `${minutesToLeftPx(s)}%`,
                width: `${minutesToLeftPx(e - s)}%`,
              }}
            />
          );
        })}

        {/* Dragging selection */}
        {drag && (
          <div
            className="absolute top-1 bottom-1 bg-green-400/40 rounded"
            style={{
              left: `${minutesToLeftPx(Math.min(drag.start, drag.end))}%`,
              width: `${minutesToLeftPx(
                Math.abs(drag.end - drag.start)
              )}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}



