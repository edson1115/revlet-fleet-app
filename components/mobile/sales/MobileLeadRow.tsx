"use client";

import Link from "next/link";

export function MobileLeadRow({ lead }: any) {
  return (
    <Link
      href={`/mobile/sales/leads/${lead.id}`}
      className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm"
    >
      <div>
        <div className="font-medium">{lead.business_name}</div>
        <div className="text-xs text-gray-500">
          {lead.contact_name || "No contact"}
        </div>
      </div>

      <span className="text-[10px] px-2 py-1 rounded-lg bg-gray-100 text-gray-700">
        {lead.status}
      </span>
    </Link>
  );
}
