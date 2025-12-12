"use client";

import { useEffect, useState } from "react";
import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

export default function DispatchQueuePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/dispatch/queue", { cache: "no-store" });
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
        title="Dispatch Queue"
        subtitle="Jobs waiting for technician assignment"
      />

      <div className="max-w-6xl mx-auto p-6 space-y-10">
        <TeslaSection label="Unassigned Requests">
          <div className="bg-white rounded-xl divide-y">

            {loading && (
              <div className="text-center text-gray-500 py-8">
                Loading jobs…
              </div>
            )}

            {!loading && rows.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                No unassigned jobs.
              </div>
            )}

            {rows.map((req) => (
              <TeslaListRow
                key={req.id}
                title={
                  req.vehicle
                    ? `${req.vehicle.year} ${req.vehicle.make} ${req.vehicle.model}`
                    : "Service Request"
                }
                subtitle={
                  req.vehicle
                    ? `${req.vehicle.plate} — ${req.vehicle.vin}`
                    : "No vehicle data"
                }
                right={
                  <div className="flex items-center gap-3">
                    {/* Needs tech */}
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full border border-red-300">
                      Unassigned
                    </span>

                    {/* Status */}
                    <TeslaStatusChip status={req.status} />
                  </div>
                }
                onClick={() => {
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
