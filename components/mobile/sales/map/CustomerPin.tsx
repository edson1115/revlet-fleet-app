"use client";

import Link from "next/link";

export function CustomerPin({ customer }: any) {
  const isVIP = customer.total_spend > 10000;

  return (
    <Link href={`/customer/${customer.id}`} className="relative">
      {/* Pulse Ring */}
      {isVIP && <div className="pulse-ring"></div>}

      {/* Pin */}
      <div className="w-4 h-4 bg-green-600 rounded-full border-2 border-white shadow-lg" />
    </Link>
  );
}
