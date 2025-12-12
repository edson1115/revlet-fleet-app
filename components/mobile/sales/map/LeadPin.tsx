"use client";

import Link from "next/link";

export function LeadPin({ lead }: any) {

  const created = new Date(lead.created_at);
  const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);

  let color = "bg-blue-500"; // old lead

  if (diffDays <= 7) color = "bg-red-600";      // NEW and HOT
  else if (diffDays <= 30) color = "bg-yellow-500"; // Warm
  else color = "bg-blue-500";                  // Cold

  return (
    <Link href={`/mobile/sales/leads/${lead.id}`}>
      <div className={`w-4 h-4 ${color} rounded-full border-2 border-white shadow-lg`} />
    </Link>
  );
}
