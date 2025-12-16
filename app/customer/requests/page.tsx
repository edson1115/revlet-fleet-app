"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TeslaCustomerRequestRow } from "@/components/tesla/customer/TeslaCustomerRequestRow";

export default function CustomerRequestsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/customer/requests", {
          cache: "no-store",
        });
        const js = await r.json();
        if (js.ok) setRows(js.rows || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = rows.filter((r) => {
    if (filter === "ALL") return true;
    return r.type === filter;
  });

  return (
    <div className="px-6 py-12 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My Requests</h2>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-100 rounded-lg px-3 py-2 text-sm"
        >
          <option value="ALL">All Requests</option>
          <option value="SERVICE">Service Requests</option>
          <option value="TIRE_PURCHASE">Tire Purchases</option>
        </select>
      </div>

      {loading && <p className="text-gray-500">Loading…</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-gray-500">No requests found.</p>
      )}

      <div className="rounded-xl border bg-white overflow-hidden">
        {filtered.map((req) => (
          <Link key={req.id} href={`/customer/requests/${req.id}`}>
            <TeslaCustomerRequestRow req={req} />
          </Link>
        ))}
      </div>
    </div>
  );
}
