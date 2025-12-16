"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaRequestRow } from "@/components/tesla/office/TeslaRequestRow";

export default function RequestListClient() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/requests", { cache: "no-store" });
    const js = await res.json();
    if (js.ok) setRows(js.rows || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <TeslaSection label="Requests">
      <div className="bg-white rounded-xl divide-y">
        {loading && (
          <div className="text-center text-gray-500 py-6">Loading…</div>
        )}

        {!loading && rows.length === 0 && (
          <div className="text-center text-gray-400 py-6">No requests found.</div>
        )}

        {rows.map((r) => (
          <TeslaRequestRow key={r.id} req={r} />
        ))}
      </div>
    </TeslaSection>
  );
}
