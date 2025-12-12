"use client";

import { useEffect, useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDispatchRow } from "@/components/tesla/dispatch/TeslaDispatchRow";
import { DispatchRequestDrawer } from "@/components/tesla/drawers/DispatchRequestDrawer";

export default function DispatchScheduledPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/dispatch/queue`, { cache: "no-store" });
    const js = await res.json();
    if (js.ok) setRows(js.rows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <TeslaHeroBar title="Dispatch Queue" subtitle="Schedule service & assign technicians" />

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <TeslaSection label="Requests Needing Scheduling">
          {loading && (
            <div className="text-center text-gray-500 py-6">
              Loading requests…
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="text-center text-gray-400 py-6">
              No requests waiting for scheduling.
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-200">
            {rows.map((req) => (
              <TeslaDispatchRow
                key={req.id}
                req={req}
                onClick={() => setSelected(req)}
              />
            ))}
          </div>
        </TeslaSection>
      </div>

      <DispatchRequestDrawer
        open={!!selected}
        request={selected}
        onClose={() => setSelected(null)}
        onChanged={() => load()}
      />
    </div>
  );
}
