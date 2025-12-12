"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDispatchQueueRow } from "@/components/tesla/dispatch/TeslaDispatchQueueRow";

export default function DispatchQueueClient() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/dispatch/queue", { cache: "no-store" });
    const js = await res.json();
    if (js.ok) setRows(js.rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <TeslaSection label="Unassigned Requests">
      <div className="bg-white rounded-xl divide-y">
        {loading && (
          <div className="text-center text-gray-500 py-6">
            Loading queue…
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="text-center text-gray-400 py-6">
            No unassigned requests.
          </div>
        )}

        {rows.map((r) => (
          <TeslaDispatchQueueRow key={r.id} req={r} />
        ))}
      </div>
    </TeslaSection>
  );
}
