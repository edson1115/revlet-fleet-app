"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";

export default function FleetHealthPanel({
  customerId,
}: {
  customerId: string;
}) {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load Revlet Fleet Health
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/customers/${customerId}/health`, {
        cache: "no-store",
      });
      const js = await res.json();
      setHealth(js);
      setLoading(false);
    }
    load();
  }, [customerId]);

  if (loading) {
    return <div className="text-gray-600 text-sm p-4">Loading…</div>;
  }

  if (!health) {
    return (
      <div className="text-gray-500 text-sm p-4">
        No fleet health data available.
      </div>
    );
  }

  const {
    totalVehicles,
    openRequests,
    daysSinceLastInspection,
    grade,
    highRiskVehicles = [],
    recentService = [],
  } = health;

  return (
    <div className="space-y-10">

      {/* -------------------------------------------
           HERO METRICS (TESLA STYLE)
      -------------------------------------------- */}
      <h2 className="text-2xl font-semibold tracking-tight">
        Fleet Health
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Vehicles"
          value={totalVehicles}
        />
        <MetricCard
          title="Open Requests"
          value={openRequests}
        />
        <MetricCard
          title="Days Since Last Inspection"
          value={daysSinceLastInspection}
        />
        <MetricCard
          title="Revlet Grade"
          value={grade}
          highlight
        />
      </div>

      <TeslaDivider className="my-8" />

      {/* -------------------------------------------
           HIGH-RISK VEHICLES (NEEDS SERVICE)
      -------------------------------------------- */}
      <section>
        <h3 className="text-lg font-semibold mb-3">
          High-Risk Vehicles
        </h3>

        {highRiskVehicles.length === 0 ? (
          <div className="text-sm text-gray-500">
            No high-risk vehicles found.
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden">
            {highRiskVehicles.map((v: any) => (
              <TeslaListRow
                key={v.id}
                title={`${v.year} ${v.make} ${v.model}`}
                subtitle={`Plate: ${v.plate}`}
                metaLeft={`Last Service: ${
                  v.last_service_at
                    ? new Date(v.last_service_at).toLocaleDateString()
                    : "—"
                }`}
                status="NEEDS SERVICE"
                rightIcon={false}
              />
            ))}
          </div>
        )}
      </section>

      <TeslaDivider className="my-8" />

      {/* -------------------------------------------
           RECENTLY SERVICED VEHICLES
      -------------------------------------------- */}
      <section>
        <h3 className="text-lg font-semibold mb-3">
          Recently Serviced
        </h3>

        {recentService.length === 0 ? (
          <div className="text-sm text-gray-500">
            No recent services recorded.
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden">
            {recentService.map((v: any) => (
              <TeslaListRow
                key={v.id}
                title={`${v.year} ${v.make} ${v.model}`}
                subtitle={`Plate: ${v.plate}`}
                metaLeft={`Completed: ${
                  v.completed_at
                    ? new Date(v.completed_at).toLocaleDateString()
                    : "—"
                }`}
                status="SERVICED"
                rightIcon={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* -------------------------------------------
   Metric Card Component
-------------------------------------------- */
function MetricCard({
  title,
  value,
  highlight = false,
}: {
  title: string;
  value: any;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        bg-white p-5 rounded-xl border shadow-sm 
        flex flex-col
      `}
    >
      <div className="text-xs text-gray-500 tracking-wide uppercase mb-1">
        {title}
      </div>

      <div
        className={`
          text-2xl font-semibold
          ${highlight ? "text-green-600" : "text-gray-900"}
        `}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}
