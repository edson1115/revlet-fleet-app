// components/office/queue/OfficeQueueClient.tsx
"use client";

import { useEffect, useState } from "react";
import OfficeRequestCard from "./OfficeRequestCard";
import OfficeRequestRow from "./OfficeRequestRow";

type Row = {
  id: string;
  status: string;
  service?: string | null;
  created_at?: string;
  vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    plate?: string | null;
    unit_number?: string | null;
  } | null;
  customer?: {
    name?: string | null;
  } | null;
};

export default function OfficeQueueClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await fetch("/api/requests?scope=internal", {
      cache: "no-store",
    }).then((x) => x.json());

    setRows(r.rows || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Office — Requests</h1>

      {/* MOBILE LIST */}
      <div className="block md:hidden space-y-3">
        {rows.map((r) => (
          <OfficeRequestRow key={r.id} row={r} />
        ))}
      </div>

      {/* DESKTOP GRID */}
      <div className="
        hidden md:grid 
        grid-cols-2 
        gap-4 
      ">
        {rows.map((r) => (
          <OfficeRequestCard key={r.id} row={r} />
        ))}
      </div>

      {rows.length === 0 && (
        <div className="p-6 text-gray-500 text-sm">No requests found.</div>
      )}
    </div>
  );
}
