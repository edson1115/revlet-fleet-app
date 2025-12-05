// components/office/queue/OfficeRequestCard.tsx
"use client";

import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";
import { openRequestDrawer } from "@/components/RequestDrawerHost";

export default function OfficeRequestCard({ row }: { row: any }) {
  const v = row.vehicle || {};
  const title = `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim();
  const plate = v.plate || v.unit_number || "";

  return (
    <div
      onClick={() => openRequestDrawer(row.id)}
      className="
        bg-white p-5 rounded-2xl border border-gray-200 shadow-sm 
        hover:shadow-md cursor-pointer transition
      "
    >
      <div className="flex justify-between items-start mb-3">
        <div className="text-gray-900 font-semibold">{title || "Vehicle"}</div>
        <TeslaStatusChip status={row.status} variant="soft" />
      </div>

      <div className="text-sm text-gray-700">{row.service || "—"}</div>

      {plate && (
        <div className="text-xs text-gray-500 mt-2">
          {plate}
        </div>
      )}

      <div className="text-xs text-gray-400 mt-3">
        {row.customer?.name || "—"}
      </div>
    </div>
  );
}
