"use client";

import { useEffect, useState } from "react";
import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import TeslaSection from "@/components/tesla/TeslaSection";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";
import { useRouter } from "next/navigation";

export default function TechQueuePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/tech/queue", { cache: "no-store" });
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
        title="My Jobs"
        subtitle="Your upcoming and active service jobs"
      />

      <div className="max-w-5xl mx-auto p-6 space-y-10">

        <TeslaSection label="Assigned Jobs">
          <div className="bg-white rounded-xl divide-y">

            {loading && (
              <div className="p-6 text-center text-gray-500">
                Loading…
              </div>
            )}

            {!loading && rows.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                No assigned jobs.
              </div>
            )}

            {rows.map((r) => (
              <TeslaListRow
                key={r.id}
                title={`${r.vehicle?.year} ${r.vehicle?.make} ${r.vehicle?.model}`}
                subtitle={`Plate ${r.vehicle?.plate} — ${r.service || "Service"}`}
                right={<TeslaStatusChip status={r.status} />}
                onClick={() => router.push(`/tech/requests/${r.id}`)}
              />
            ))}

          </div>
        </TeslaSection>

      </div>
    </TeslaLayoutShell>
  );
}
