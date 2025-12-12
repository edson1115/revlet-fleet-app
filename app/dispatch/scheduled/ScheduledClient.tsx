"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaScheduleRow } from "@/components/tesla/dispatch/TeslaScheduleRow";

export default function ScheduledClient() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/dispatch/scheduled", { cache: "no-store" });
    const js = await res.json();
    if (js.ok) setRows(js.rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <TeslaSection label="Today’s Schedule">
      <div className="bg-white rounded-xl divide-y">
        {loading && (
          <div className="text-center text-gray-500 py-6">
            Loading schedule…
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="text-center text-gray-400 py-6">
            No scheduled jobs today.
          </div>
        )}

        {rows.map((r) => (
          <TeslaScheduleRow key={r.id} req={r} />
        ))}
      </div>
    </TeslaSection>
  );
}
