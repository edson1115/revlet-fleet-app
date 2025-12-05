// components/office/queue/OfficeRequestRow.tsx
"use client";

import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";
import { openRequestDrawer } from "@/components/RequestDrawerHost";

export default function OfficeRequestRow({ row }: { row: any }) {
  const v = row.vehicle || {};

  const title = `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim();
  const subtitle = row.service || "—";

  const plate = v.plate || v.unit_number || "";

  return (
    <div
      onClick={() => openRequestDrawer(row.id)}
      className="
        p-4 border border-gray-200 rounded-xl bg-white
        flex justify-between items-center
        active:bg-gray-100 transition cursor-pointer
      "
    >
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-gray-600">{subtitle}</div>
        {plate && <div className="text-xs text-gray-500 mt-1">{plate}</div>}
      </div>

      <TeslaStatusChip status={row.status} />
    </div>
  );
}
