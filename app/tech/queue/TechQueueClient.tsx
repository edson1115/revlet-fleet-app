"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaTechJobRow } from "@/components/tesla/tech/TeslaTechJobRow";

export default function TechQueueClient() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/tech/queue", { cache: "no-store" });
    const js = await res.json();
    if (js.ok) setRows(js.rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <TeslaSection label="Today's Jobs">
      <div className="bg-white rounded-xl divide-y">

        {loading && (
          <div className="py-6 text-center text-gray-500">
            Loading assigned jobs…
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="py-6 text-center text-gray-400">
            No assigned jobs.
          </div>
        )}

        {rows.map((r) => (
          <TeslaTechJobRow key={r.id} req={r} />
        ))}

      </div>
    </TeslaSection>
  );
}
