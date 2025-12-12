"use client";

import { useEffect, useState } from "react";
import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

export default function DispatchScheduledPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/dispatch/scheduled", { cache: "no-store" });
    const js = await res.json();

    if (js.ok) setRows(js.rows || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <TeslaLayoutShell>
      <TeslaHeroBar
        title="Scheduled Jobs"
        subtitle="All approved + assigned jobs for your markets"
      />

      <div className="max-w-6xl mx-auto p-6 space-y-10">

        <TeslaSection label="Scheduled Work">
          <div className="bg-white rounded-xl divide-y">

            {loading && (
              <div className="text-center text-gray-500 py-8">
                Loading scheduled jobs…
              </div>
            )}

            {!loading && rows.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                No scheduled jobs yet.
              </div>
            )}

            {rows.map((req) => (
              <TeslaListRow
                key={req.id}
                title={`${req.vehicle?.year} ${req.vehicle?.make} ${req.vehicle?.model}`}
                subtitle={`${req.vehicle?.plate} — ${req.vehicle?.vin}`}
                right={
                  <div className="flex items-center gap-3">
                    {/* Technician */}
                    {req.tech && (
                      <span className="text-xs px-2 py-1 rounded-full bg-black text-white">
                        {req.tech.full_name}
                      </span>
                    )}

                    {/* ETA */}
                    {req.eta_start && req.eta_end && (
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-md border border-gray-300 text-gray-700">
                        ETA {req.eta_start}–{req.eta_end}
                      </span>
                    )}

                    <TeslaStatusChip status={req.status} />
                  </div>
                }
                onClick={() => {
                  // Open request detail
                  window.location.href = `/dispatch/requests/${req.id}`;
                }}
              />
            ))}

          </div>
        </TeslaSection>

      </div>
    </TeslaLayoutShell>
  );
}
