"use client";

import { useEffect, useState } from "react";
import { MobileLeadRow } from "@/components/mobile/sales/MobileLeadRow";

export default function MobileSalesLeadsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await fetch("/api/sales/leads", { cache: "no-store" }).then(r => r.json());
    if (r.ok) setRows(r.rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Sales Leads</h1>

      {loading && <div className="text-gray-500">Loading…</div>}

      {!loading && rows.length === 0 && (
        <div className="text-gray-400 text-center text-sm">No leads yet.</div>
      )}

      <div className="space-y-3">
        {rows.map((lead) => (
          <MobileLeadRow key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}
