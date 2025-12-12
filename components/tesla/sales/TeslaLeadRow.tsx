"use client";

import Link from "next/link";
import clsx from "clsx";

export function TeslaLeadRow({ lead }: any) {
  return (
    <Link
      href={`/sales/leads/${lead.id}`}
      className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition"
    >
      <div>
        <div className="font-medium">{lead.business_name}</div>
        <div className="text-xs text-gray-500">
          {lead.contact_name} — {lead.phone || "No phone"}
        </div>
      </div>

      <span
        className={clsx(
          "text-xs px-3 py-1 rounded-full border",
          lead.status === "NEW" && "bg-gray-100 text-gray-700 border-gray-300",
          lead.status === "VISITED" && "bg-blue-100 text-blue-700 border-blue-300",
          lead.status === "CONVERTED" && "bg-green-100 text-green-700 border-green-300"
        )}
      >
        {lead.status}
      </span>
    </Link>
  );
}
