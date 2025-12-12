"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CustomerVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/customer/vehicles", { cache: "no-store" });
      const js = await res.json();
      if (js.ok) setVehicles(js.vehicles || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading vehicles…</div>;
  }

  return (
    <div className="px-6 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {vehicles.map((v) => (
          <Link
            key={v.id}
            href={`/customer/vehicles/${v.id}`}
            className="border rounded-xl p-4 shadow-sm bg-white hover:shadow-md transition"
          >
            <div className="font-semibold">{v.year} {v.make} {v.model}</div>
            <div className="text-gray-500 text-sm mt-1">{v.plate}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
