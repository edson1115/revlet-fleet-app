"use client";

import clsx from "clsx";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

type Props = {
  title: string;                 // OFFICE service name (wins)
  subtitle?: string;             // Vehicle line
  status: string;
  createdAt?: string;
  po?: string | null;
  urgent?: boolean;

  /** NEW */
  customer?: string;
  notePreview?: string | null;

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
  onClick,
}: Props) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "rounded-2xl border bg-white p-5 shadow-sm transition cursor-pointer",
        urgent
          ? "border-red-300 hover:shadow-md"
          : "hover:shadow-md"
      )}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          {/* OFFICE SERVICE NAME (PRIMARY) */}
          <div className="text-base font-semibold text-gray-900">
            {title}
          </div>

          {/* CUSTOMER */}
          {customer && (
            <div className="text-sm text-gray-700">
              {customer}
            </div>
          )}

          {/* VEHICLE */}
          {subtitle && (
            <div className="text-sm text-gray-500">
              {subtitle}
            </div>
          )}
        </div>

        <TeslaStatusChip status={status} />
      </div>

      {/* CUSTOMER NOTE PREVIEW */}
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
