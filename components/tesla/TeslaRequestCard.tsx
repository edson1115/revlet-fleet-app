"use client";

import clsx from "clsx";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

type Props = {
  title: string;
  subtitle?: string;
  status: string;
  createdAt?: string;
  po?: string | null;
  urgent?: boolean;

  customer?: string;
  notePreview?: string | null;
  isWalkIn?: boolean;

  onClick?: () => void;
};

function timeAgo(date?: string) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function TeslaRequestCard({
  title,
  subtitle,
  status,
  createdAt,
  po,
  urgent,
  customer,
  notePreview,
  isWalkIn,
  onClick,
}: Props) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && e.key === "Enter") onClick();
      }}
      className={clsx(
        "relative rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md focus:outline-none",
        onClick && "cursor-pointer focus:ring-2 focus:ring-black",
        urgent
          ? "border-red-300 bg-red-50"
          : status === "WAITING"
          ? "bg-amber-50"
          : ""
      )}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-base font-semibold text-gray-900">
            {title}
          </div>

          {customer && (
            <div className="text-sm text-gray-700">
              {customer}
            </div>
          )}

          {subtitle && (
            <div className="text-sm text-gray-500">
              {subtitle}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isWalkIn && (
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-300 font-medium">
              Walk-In
            </span>
          )}
          <TeslaStatusChip status={status} />
        </div>
      </div>

      {notePreview && (
        <div className="mt-3 text-sm text-gray-600 line-clamp-2">
          “{notePreview}”
        </div>
      )}

      {/* META */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span>
            PO:{" "}
            <span
              className={clsx(
                po ? "text-gray-800" : "text-red-600 font-semibold"
              )}
            >
              {po || "MISSING"}
            </span>
          </span>

          {urgent && (
            <span className="text-red-600 font-semibold">
              URGENT
            </span>
          )}
        </div>

        {createdAt && (
          <span>Created {timeAgo(createdAt)}</span>
        )}
      </div>
    </div>
  );
}
