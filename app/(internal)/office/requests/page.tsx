"use client";

import { useEffect, useState } from "react";
import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaOfficeRequestRow } from "@/components/tesla/office/TeslaOfficeRequestRow";
import { TeslaSegmented } from "@/components/tesla/TeslaSegmented";

export default function OfficeRequestsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<"ALL" | "TIRE" | "SERVICE">("ALL");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/requests?office=1", {
      cache: "no-store",
    });
    const js = await res.json();

    if (js.ok) setRows(js.rows || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) => {
    if (filter === "ALL") return true;
    if (filter === "TIRE") return r.type === "TIRE_PURCHASE" || r.type === "TIRE_ORDER";
    if (filter === "SERVICE") return r.type !== "TIRE_PURCHASE" && r.type !== "TIRE_ORDER";
    return true;
  });

  return (
    <TeslaLayoutShell>
      <TeslaHeroBar
        title="Office Requests"
        subtitle="Review, approve, and schedule service & tire orders"
      />

      <div className="max-w-6xl mx-auto p-6 space-y-10">
        {/* FILTER BAR */}
        <TeslaSection label="Filters">
          <TeslaSegmented
            value={filter}
            onChange={setFilter}
            options={[
              { label: "All", value: "ALL" },
              { label: "Tire Requests", value: "TIRE" },
              { label: "Service Requests", value: "SERVICE" },
            ]}
          />
        </TeslaSection>

        {/* REQUEST LIST */}
        <TeslaSection label="Requests">
          <div className="bg-white rounded-xl divide-y">
            {loading && (
              <div className="text-center text-gray-500 py-6">Loading…</div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="text-center text-gray-400 py-6">
                No requests found.
              </div>
            )}

            {filtered.map((r) => (
              <TeslaOfficeRequestRow key={r.id} req={r} />
            ))}
          </div>
        </TeslaSection>
      </div>
    </TeslaLayoutShell>
  );
}
