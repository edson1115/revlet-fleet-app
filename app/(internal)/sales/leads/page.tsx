"use client";

import { useEffect, useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaLeadRow } from "@/components/tesla/sales/TeslaLeadRow";

export default function SalesLeadsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/sales/leads", { cache: "no-store" });
    const js = await res.json();
    if (js.ok) setRows(js.rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <TeslaHeroBar
        title="Sales Leads"
        subtitle="Track prospects, visits, and conversions"
      />

      <div className="mt-6 bg-white rounded-xl divide-y">
        {loading && (
          <div className="py-8 text-center text-gray-500">Loading…</div>
        )}

        {!loading && rows.length === 0 && (
          <div className="py-8 text-center text-gray-400">No leads yet.</div>
        )}

        {rows.map((lead: any) => (
          <TeslaLeadRow key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}
