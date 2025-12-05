// components/tesla/TeslaStatusChip.tsx
"use client";

import clsx from "clsx";

export type TeslaStatus =
  | "NEW"
  | "WAITING_TO_BE_SCHEDULED"
  | "WAITING_FOR_APPROVAL"
  | "WAITING_FOR_PARTS"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DISPATCHED"
  | "DECLINED"
  | string;

type Props = {
  status: TeslaStatus;
  size?: "xs" | "sm" | "md";
  variant?: "soft" | "outline";
  className?: string;
};

// Normalize request.status → uppercase + underscores
function normalizeStatus(raw: TeslaStatus): string {
  if (!raw) return "UNKNOWN";
  return String(raw).trim().toUpperCase().replace(/\s+/g, "_");
}

// Display version for UI
function prettyStatus(raw: TeslaStatus): string {
  if (!raw) return "Unknown";
  return String(raw).trim().replace(/_/g, " ").toUpperCase();
}

export function TeslaStatusChip({
  status,
  size = "xs",
  variant = "soft",
  className = "",
}: Props) {
  const norm = normalizeStatus(status);

  //
  // 🔥 TESLA COLOR MAP — Option C (your approved mapping)
  //
  const colorMap: Record<string, { soft: string; outline: string }> = {
    NEW: {
      soft: "bg-gray-100 text-gray-900 border-gray-300",
      outline: "bg-transparent text-gray-800 border-gray-400",
    },

    WAITING_TO_BE_SCHEDULED: {
      soft: "bg-gray-100 text-gray-900 border-gray-300",
      outline: "bg-transparent text-gray-800 border-gray-400",
    },

    WAITING_FOR_APPROVAL: {
      soft: "bg-yellow-100 text-yellow-900 border-yellow-300",
      outline: "bg-transparent text-yellow-800 border-yellow-400",
    },

    WAITING_FOR_PARTS: {
      soft: "bg-yellow-100 text-yellow-900 border-yellow-300",
      outline: "bg-transparent text-yellow-800 border-yellow-400",
    },

    SCHEDULED: {
      soft: "bg-blue-100 text-blue-900 border-blue-300",
      outline: "bg-transparent text-blue-800 border-blue-400",
    },

    IN_PROGRESS: {
      soft: "bg-black text-white border-black",
      outline: "bg-transparent text-black border-black",
    },

    COMPLETED: {
      soft: "bg-green-100 text-green-900 border-green-300",
      outline: "bg-transparent text-green-800 border-green-400",
    },

    // Optional legacy statuses kept for compatibility
    DISPATCHED: {
      soft: "bg-slate-100 text-slate-900 border-slate-300",
      outline: "bg-transparent text-slate-800 border-slate-400",
    },

    DECLINED: {
      soft: "bg-red-100 text-red-900 border-red-300",
      outline: "bg-transparent text-red-800 border-red-400",
    },
  };

  const colors =
    colorMap[norm] ??
    colorMap["NEW"]; // fallback default Tesla style

  //
  // Size rules (unchanged)
  //
  const sizeCls =
    size === "md"
      ? "px-3 py-1 text-xs"
      : size === "sm"
      ? "px-2.5 py-0.5 text-[11px]"
      : "px-2 py-0.5 text-[10px]";

  //
  // Mode (soft vs outline)
  //
  const variantCls = variant === "outline" ? colors.outline : colors.soft;

  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded-full border font-medium tracking-tight",
        sizeCls,
        variantCls,
        className
      )}
    >
      {prettyStatus(status)}
    </span>
  );
}
