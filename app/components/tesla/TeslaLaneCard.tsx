"use client";

import React from "react";
import ImageCountPill from "@/components/images/ImageCountPill";

type Thumb = {
  id: string;
  kind: string;
  url_thumb: string;
};

export default function TeslaLaneCard({ r, thumbs, tone, onClick }: any) {
  const toneClass =
    tone === "amber"
      ? "bg-amber-50 border border-amber-200"
      : tone === "blue"
      ? "bg-[#F4FAFF] border border-[#CDE7FF]"
      : "bg-white border border-gray-200";

  const badgeClass =
    tone === "amber"
      ? "bg-amber-600"
      : tone === "blue"
      ? "bg-sky-800"
      : "bg-black";

  function fmtWindow(start?: string, end?: string) {
    if (!start) return "—";
    const s = new Date(start);
    const e = end ? new Date(end) : null;

    const sFmt = s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (!e) return sFmt;

    const eFmt = e.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `${sFmt} → ${eFmt}`;
  }

  const stats = {
    total: thumbs.length,
    before: thumbs.filter((t: Thumb) => t.kind === "BEFORE").length,
    after: thumbs.filter((t: Thumb) => t.kind === "AFTER").length,
    other: thumbs.filter((t: Thumb) => !["BEFORE", "AFTER"].includes(t.kind)).length,
  };

  return (
    <li
      draggable
      onDragStart={(e) => e.dataTransfer.setData("request-id", r.id)}
      onClick={onClick}
      className={`rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col gap-4 ${toneClass}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="text-xs">{fmtWindow(r.scheduled_at, r.scheduled_end_at)}</div>
          {r.technician && (
            <div className="text-[11px] text-gray-500">
              Tech: {r.technician.full_name}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ImageCountPill {...stats} />
          <span className={`px-2 py-0.5 text-[10px] text-white rounded-full ${badgeClass}`}>
            {String(r.status).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="text-sm">
        <div className="text-gray-500">Service:</div>
        {r.service}
      </div>
    </li>
  );
}
