"use client";

import { useEffect, useState } from "react";
import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";
import { useRouter } from "next/navigation";

// Helper to group by "Today / This Week / Older"
function groupByRecency(rows: any[]) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const weekStr = startOfWeek.toISOString().split("T")[0];

  const groups: Record<string, any[]> = {
    "Completed Today": [],
    "Completed This Week": [],
    "Older Jobs": [],
  };

  rows.forEach((r) => {
    const completed = r.completed_at?.split("T")[0];

    if (completed === todayStr) {
      groups["Completed Today"].push(r);
    } else if (completed >= weekStr) {
      groups["Completed This Week"].push(r);
    } else {
      groups["Older Jobs"].push(r);
    }
  });

  return groups;
}

export default function TechCompletedJobsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/tech/completed", { cache: "no-store" });
    const js = await res.json();
    if (js.ok) setRows(js.rows || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Group for Tesla UI layout
  const grouped = groupByRecency(rows);

  return (
    <TeslaLayoutShell>
      <TeslaHeroBar
        title="Completed Jobs"
        subtitle="Your finished repair & service work"
      />

      <div className="max-w-5xl mx-auto p-6 space-y-12">

        {loading && (
          <div className="text-center text-gray-500 py-10">
            Loading…
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            No completed jobs yet.
          </div>
        )}

        {!loading &&
          Object.entries(grouped).map(([label, list]) =>
            list.length > 0 ? (
              <TeslaSection key={label} label={label}>
                <div className="bg-white rounded-xl divide-y">
                  {list.map((r: any) => (
                    <TeslaListRow
                      key={r.id}
                      title={`${r.vehicle?.year} ${r.vehicle?.make} ${r.vehicle?.model}`}
                      subtitle={`Plate ${r.vehicle?.plate} — ${r.service || "Service"}`}
                      right={<TeslaStatusChip status="COMPLETED" />}
                      onClick={() => router.push(`/tech/requests/${r.id}`)}
                    />
                  ))}
                </div>
              </TeslaSection>
            ) : null
          )}

      </div>
    </TeslaLayoutShell>
  );
}
