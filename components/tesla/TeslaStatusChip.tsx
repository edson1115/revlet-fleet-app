"use client";

import clsx from "clsx";

export type TeslaStatus =
  | "NEW"
  | "WAITING_TO_BE_SCHEDULED"
  | "WAITING APPROVAL"
  | "WAITING_APPROVAL"
  | "WAITING_PARTS"
  | "WAITING FOR PARTS"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "IN PROGRESS"
  | "DISPATCHED"
  | "COMPLETED"
  | "DECLINED"
  | string;

type Props = {
  status: TeslaStatus;
  size?: "xs" | "sm" | "md";
  variant?: "soft" | "outline";
  className?: string;
};

function normalizeStatus(raw: TeslaStatus): string {
  if (!raw) return "UNKNOWN";
  return String(raw).trim().toUpperCase().replace(/\s+/g, "_");
}

function prettyStatus(raw: TeslaStatus): string {
  if (!raw) return "Unknown";
  return String(raw)
    .trim()
    .replace(/_/g, " ")
    .toUpperCase();
}

export function TeslaStatusChip({
  status,
  size = "xs",
  variant = "soft",
  className = "",
}: Props) {
  const norm = normalizeStatus(status);

  const colorMap: Record<
    string,
    {
      soft: string;
      outline: string;
    }
  > = {
    NEW: {
      soft: "bg-[#F2F2F2] text-black border-[#E5E5E5]",
      outline: "bg-transparent text-black border-gray-400",
    },
    WAITING_TO_BE_SCHEDULED: {
      soft: "bg-yellow-50 text-yellow-900 border-yellow-300",
      outline: "bg-transparent text-yellow-800 border-yellow-400",
    },
    WAITING_APPROVAL: {
      soft: "bg-amber-50 text-amber-900 border-amber-300",
      outline: "bg-transparent text-amber-800 border-amber-400",
    },
    WAITING_PARTS: {
      soft: "bg-orange-50 text-orange-900 border-orange-300",
      outline: "bg-transparent text-orange-800 border-orange-400",
    },
    SCHEDULED: {
      soft: "bg-blue-50 text-blue-800 border-blue-300",
      outline: "bg-transparent text-blue-700 border-blue-400",
    },
    IN_PROGRESS: {
      soft: "bg-purple-50 text-purple-800 border-purple-300",
      outline: "bg-transparent text-purple-700 border-purple-400",
    },
    DISPATCHED: {
      soft: "bg-slate-50 text-slate-800 border-slate-300",
      outline: "bg-transparent text-slate-700 border-slate-400",
    },
    COMPLETED: {
      soft: "bg-green-50 text-green-800 border-green-300",
      outline: "bg-transparent text-green-700 border-green-400",
    },
    DECLINED: {
      soft: "bg-red-50 text-red-800 border-red-300",
      outline: "bg-transparent text-red-700 border-red-400",
    },
  };

  const colors =
    colorMap[norm] ??
    {
      soft: "bg-gray-100 text-gray-800 border-gray-300",
      outline: "bg-transparent text-gray-700 border-gray-400",
    };

  const sizeCls =
    size === "md"
      ? "px-3 py-1 text-xs"
      : size === "sm"
      ? "px-2.5 py-0.5 text-[11px]"
      : "px-2 py-0.5 text-[10px]";

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
