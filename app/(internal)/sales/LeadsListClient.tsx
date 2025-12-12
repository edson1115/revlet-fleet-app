"use client";

import { useEffect, useState } from "react";
import LeadRow from "./LeadRow";

export default function LeadsListClient() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const r = await fetch("/api/sales/leads", { cache: "no-store" });
      const j = await r.json();
      setRows(j.rows || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-gray-400">Loading…</div>;

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <LeadRow key={row.id} row={row} />
      ))}
    </div>
  );
}
