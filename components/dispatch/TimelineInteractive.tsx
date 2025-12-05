"use client";

import React, { useState, useRef, useEffect } from "react";

export default function TimelineInteractive({
  current = null,
  busyBlocks = [],
  onChange,
  onDragComplete,
}: {
  current?: { start_at: string; end_at: string } | null;
  busyBlocks?: { start_at: string; end_at: string }[];
  onChange?: (range: { start: string; end: string }) => void;
  onDragComplete?: (range: { start: string; end: string }) => void;
}) {
  const [startPos, setStartPos] = useState<number | null>(null);
  const [endPos, setEndPos] = useState<number | null>(null);

  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef<number>(0);

  const refBar = useRef<HTMLDivElement>(null);

  /////////////////////////////////////////////////////////
  // Helpers
  /////////////////////////////////////////////////////////
  function pxToIso(px: number) {
    const bar = refBar.current;
    if (!bar) return null;

    const rect = bar.getBoundingClientRect();
    const ratio = (px - rect.left) / rect.width;

    const msStart = new Date().setHours(0, 0, 0, 0);
    const msEnd = msStart + 24 * 60 * 60 * 1000;

    const stamp = msStart + ratio * (msEnd - msStart);
    return new Date(stamp).toISOString();
  }

  function blockToPercent(startISO: string, endISO: string) {
    const dayStart = new Date().setHours(0, 0, 0, 0);
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const s = new Date(startISO).getTime();
    const e = new Date(endISO).getTime();

    return {
      left: ((s - dayStart) / (dayEnd - dayStart)) * 100,
      width: ((e - dayStart) / (dayEnd - dayStart)) * 100 - ((s - dayStart) / (dayEnd - dayStart)) * 100,
    };
  }

  /////////////////////////////////////////////////////////
  // Mouse Events
  /////////////////////////////////////////////////////////
  function handleStart(e: React.MouseEvent) {
    const bar = refBar.current;
    if (!bar) return;

    // Check if user clicked ON the green scheduled block
    if (current) {
      const block = blockToPercent(current.start_at, current.end_at);
      const rect = bar.getBoundingClientRect();

      const pxLeft = rect.left + (block.left / 100) * rect.width;
      const pxRight = pxLeft + (block.width / 100) * rect.width;

      if (e.clientX >= pxLeft && e.clientX <= pxRight) {
        // START DRAG
        setDragging(true);
        dragOffset.current = e.clientX - pxLeft;
        return;
      }
    }

    // NEW SELECTION
    setStartPos(e.clientX);
    setEndPos(null);
  }

  function handleDrag(e: React.MouseEvent) {
    if (dragging && current) {
      const bar = refBar.current;
      if (!bar) return;

      const rect = bar.getBoundingClientRect();
      const blockWidth =
        blockToPercent(current.start_at, current.end_at).width;

      // New left position
      const newLeftPx = e.clientX - dragOffset.current;

      const startIso = pxToIso(newLeftPx);
      const endIso = pxToIso(
        newLeftPx + (blockWidth / 100) * rect.width
      );

      if (startIso && endIso && onChange) {
        onChange({ start: startIso, end: endIso });
      }
      return;
    }

    if (startPos !== null) {
      setEndPos(e.clientX);
    }
  }

  function handleEnd() {
    if (dragging && onDragComplete && startPos === null) {
      // Drag complete
      if (onChange) {
        onDragComplete({
          start: onChange.start,
          end: onChange.end,
        } as any);
      }
    }

    if (startPos !== null && endPos !== null && onChange) {
      const start = Math.min(startPos, endPos);
      const end = Math.max(startPos, endPos);
      const isoStart = pxToIso(start);
      const isoEnd = pxToIso(end);
      if (isoStart && isoEnd) onChange({ start: isoStart, end: isoEnd });
    }

    setDragging(false);
    setStartPos(null);
    setEndPos(null);
  }

  /////////////////////////////////////////////////////////
  // Render
  /////////////////////////////////////////////////////////
  return (
    <div className="space-y-2 select-none">
      <div
        ref={refBar}
        onMouseDown={handleStart}
        onMouseMove={handleDrag}
        onMouseUp={handleEnd}
        className="relative h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-300 cursor-crosshair"
      >
        {/* BUSY BLOCKS (gray) */}
        {busyBlocks.map((b, i) => {
          const { left, width } = blockToPercent(b.start_at, b.end_at);
          return (
            <div
              key={i}
              className="absolute top-0 h-full bg-gray-400/50 rounded"
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}

        {/* CURRENT SCHEDULED BLOCK (green) */}
        {current && (
          <div
            className="absolute top-0 h-full rounded bg-[#80FF44]/40 border border-[#80FF44]"
            style={{
              left: `${blockToPercent(current.start_at, current.end_at).left}%`,
              width: `${blockToPercent(current.start_at, current.end_at).width}%`,
            }}
          />
        )}

        {/* NEW SELECTION */}
        {startPos !== null && endPos !== null && (
          <div
            className="absolute top-0 h-full bg-green-300/40 rounded"
            style={{
              left: `${Math.min(startPos, endPos) -
                refBar.current!.getBoundingClientRect().left}px`,
              width: `${Math.abs(endPos - startPos)}px`,
            }}
          />
        )}
      </div>

      <div className="flex justify-between text-xs text-gray-500 px-1">
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>12 AM</span>
      </div>
    </div>
  );
}



