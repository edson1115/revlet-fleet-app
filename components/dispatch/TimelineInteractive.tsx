"use client";

import React, { useState, useRef } from "react";

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
  // Selection state
  const [startPos, setStartPos] = useState<number | null>(null);
  const [endPos, setEndPos] = useState<number | null>(null);

  // Drag state
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
    // Clamp px within bar bounds
    const clamedPx = Math.max(rect.left, Math.min(px, rect.right));
    const ratio = (clamedPx - rect.left) / rect.width;

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

    const left = ((s - dayStart) / (dayEnd - dayStart)) * 100;
    const width = ((e - dayStart) / (dayEnd - dayStart)) * 100 - left;

    return { left, width };
  }

  /////////////////////////////////////////////////////////
  // Mouse Events
  /////////////////////////////////////////////////////////
  function handleMouseDown(e: React.MouseEvent) {
    const bar = refBar.current;
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX;

    // 1. Check if clicking on the EXISTING block (to drag it)
    if (current) {
      const { left, width } = blockToPercent(current.start_at, current.end_at);
      
      const pxLeft = rect.left + (left / 100) * rect.width;
      const pxRight = pxLeft + (width / 100) * rect.width;

      if (clickX >= pxLeft && clickX <= pxRight) {
        setDragging(true);
        dragOffset.current = clickX - pxLeft;
        return;
      }
    }

    // 2. Otherwise, start NEW selection
    setStartPos(clickX);
    setEndPos(clickX); // Initialize endPos same as start
  }

  function handleMouseMove(e: React.MouseEvent) {
    const bar = refBar.current;
    if (!bar) return;

    // DRAGGING EXISTING BLOCK
    if (dragging && current) {
      const rect = bar.getBoundingClientRect();
      const { width: widthPercent } = blockToPercent(current.start_at, current.end_at);

      // Calculate new start position based on offset
      let newLeftPx = e.clientX - dragOffset.current;
      
      // Boundaries
      // newLeftPx = Math.max(rect.left, Math.min(newLeftPx, rect.right - (widthPercent / 100) * rect.width));

      const startIso = pxToIso(newLeftPx);
      const endIso = pxToIso(newLeftPx + (widthPercent / 100) * rect.width);

      if (startIso && endIso && onChange) {
        onChange({ start: startIso, end: endIso });
      }
      return;
    }

    // CREATING NEW SELECTION
    if (startPos !== null) {
      setEndPos(e.clientX);
    }
  }

  function handleMouseUp(e: React.MouseEvent) {
    // 1. End Dragging
    if (dragging) {
      if (onDragComplete && current) {
        // FIX: Use 'current' prop which holds the latest dragged values
        onDragComplete({
          start: current.start_at,
          end: current.end_at,
        });
      }
      setDragging(false);
      return;
    }

    // 2. End New Selection
    if (startPos !== null && endPos !== null && onChange) {
      // Differentiate click vs drag
      if (Math.abs(startPos - endPos) < 5) {
        // It was just a click, reset
        setStartPos(null);
        setEndPos(null);
        return;
      }

      const startPx = Math.min(startPos, endPos);
      const endPx = Math.max(startPos, endPos);
      
      const isoStart = pxToIso(startPx);
      const isoEnd = pxToIso(endPx);

      if (isoStart && isoEnd) {
        onChange({ start: isoStart, end: isoEnd });
        if (onDragComplete) {
            onDragComplete({ start: isoStart, end: isoEnd });
        }
      }
    }

    setStartPos(null);
    setEndPos(null);
  }

  return (
    <div className="space-y-2 select-none">
      <div
        ref={refBar}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
           if(dragging) handleMouseUp(null as any);
           setStartPos(null);
           setEndPos(null);
        }}
        className="relative h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-300 cursor-crosshair touch-none"
      >
        {/* BUSY BLOCKS (gray) */}
        {busyBlocks.map((b, i) => {
          const { left, width } = blockToPercent(b.start_at, b.end_at);
          return (
            <div
              key={i}
              className="absolute top-0 h-full bg-gray-300/50 border-r border-white/20"
              style={{ left: `${left}%`, width: `${width}%` }}
              title="Busy"
            />
          );
        })}

        {/* CURRENT SCHEDULED BLOCK (green) */}
        {current && (
          <div
            className="absolute top-0 h-full bg-[#80FF44]/60 border-l-2 border-r-2 border-[#5cb82a] shadow-sm z-10 cursor-move"
            style={{
              left: `${blockToPercent(current.start_at, current.end_at).left}%`,
              width: `${blockToPercent(current.start_at, current.end_at).width}%`,
            }}
          >
             <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#2a5c12] opacity-0 hover:opacity-100 transition-opacity">
                DRAG
             </div>
          </div>
        )}

        {/* NEW SELECTION HIGHLIGHT (while dragging to create) */}
        {startPos !== null && endPos !== null && !dragging && (
          <div
            className="absolute top-0 h-full bg-blue-400/30 border border-blue-500 z-20"
            style={{
              left: `${Math.min(startPos, endPos) - (refBar.current?.getBoundingClientRect().left || 0)}px`,
              width: `${Math.abs(endPos - startPos)}px`,
            }}
          />
        )}
      </div>

      {/* Time Labels */}
      <div className="flex justify-between text-[10px] text-gray-400 px-1 font-mono uppercase tracking-wider">
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>11:59 PM</span>
      </div>
    </div>
  );
}