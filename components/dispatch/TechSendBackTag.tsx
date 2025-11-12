"use client";

import React from "react";

type Props = {
  dispatchNotes?: string | null;
  className?: string;
};

/**
 * Display-only badge.
 * Renders when dispatch_notes starts with "Tech send-back:" (case-insensitive).
 * Used in Office + Dispatch so they can instantly see items returned by Tech.
 */
export default function TechSendBackTag({ dispatchNotes, className = "" }: Props) {
  if (!dispatchNotes) return null;

  const raw = String(dispatchNotes).trim();
  const upper = raw.toUpperCase();

  if (!upper.startsWith("TECH SEND-BACK:")) return null;

  return (
    <span
      className={
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold " +
        "bg-amber-100 text-amber-900 border border-amber-300 " +
        className
      }
      title={raw}
    >
      Tech send-back
    </span>
  );
}
