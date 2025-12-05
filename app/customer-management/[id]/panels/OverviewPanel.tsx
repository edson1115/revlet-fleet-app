"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

export default function OverviewPanel({
  customer,
  customerId,
  onOpenLightbox,
}: {
  customer: any;
  customerId: string;
  onOpenLightbox: (images: any[], index: number) => void;
}) {
  const [health, setHealth] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [recentVehicles, setRecentVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // LOAD ALL DATA
  useEffect(() => {
    async function load() {
      const [h, reqs, veh] = await Promise.all([
        fetch(`/api/customers/${customerId}/health`).then((r) => r.json()),
        fetch(`/api/customers/${customerId}/recent-requests`).then((r) =>
          r.json()
        ),
        fetch(`/api/customers/${customerId}/recent-vehicles`).then((r) =>
          r.json()
        ),
      ]);

      setHealth(h);
      setRecentRequests(reqs.data || []);
      setRecentVehicles(veh.data || []);
      setLoading(false);
    }

    load();
  }, [customerId]);

  if (loading) {
    return <div className="text-sm text-gray-600">Loading…</div>;
  }

  const {
    totalVehicles,
    openRequests,
    highRiskVehicles = [],
    daysSinceLastInspection,
    grade,
  } = health || {};

  return (
    <div className="space-y-12">

      {/* ------------------------------------------------------
           HERO TOP BAR
      ------------------------------------------------------ */}
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">
          {customer.name}
        </h1>

        <p className="text-gray-600 mt-1">
          {customer.address || "No address on file"}
        </p>

        <div className="mt-4 inline-block bg-black text-white px-4 py-2 rounded-xl text-lg font-semibold">
          Revlet Grade: {grade || "—"}
        </div>
      </section>

      <TeslaDivider />

      {/* ------------------------------------------------------
           METRICS BLOCK
      ------------------------------------------------------ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Vehicles" value={totalVehicles} />
        <MetricCard title="Open Requests" value={openRequests} />
        <MetricCard
          title="High-Risk Vehicles"
          value={highRiskVehicles.length}
        />
        <MetricCard
          title="Days Since Last Inspection"
          value={daysSinceLastInspection}
        />
      </section>

      <TeslaDivider />

      {/* ------------------------------------------------------
           QUICK ACTIONS
      ------------------------------------------------------ */}
      <section>
        <h2 className="text-xl font-semibold mb-4 tracking-tight">
          Quick Actions
        </h2>

        <div className="flex flex-wrap gap-3">
          <ActionButton 
            label="New Service Request"
            href={`/fm/requests/new?customer=${customerId}`}
          />
          <ActionButton 
            label="View Vehicles"
            href={`/customer-management/${customerId}?tab=vehicles`}
          />
          <ActionButton 
            label="View Requests"
            href={`/customer-management/${customerId}?tab=requests`}
          />
        </div>
      </section>

      {/* ------------------------------------------------------
           RECENT REQUESTS
      ------------------------------------------------------ */}
      <section>
        <h2 className="text-xl font-semibold mb-3 tracking-tight">
          Recent Requests
        </h2>

        <div className="rounded-xl border bg-white overflow-hidden">
          {recentRequests.length === 0 && (
            <div className="p-6 text-gray-500 text-sm">
              No recent requests.
            </div>
          )}

          {recentRequests.map((r: any) => (
            <TeslaListRow
              key={r.id}
              title={`${r.vehicle_year} ${r.vehicle_make} ${r.vehicle_model}`}
              subtitle={r.service || "Service Request"}
              metaLeft={`Created: ${
                r.created_at
                  ? new Date(r.created_at).toLocaleDateString()
                  : ""
              }`}
              status={r.status}
              rightIcon={true}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------
           RECENT VEHICLES
      ------------------------------------------------------ */}
      <section>
        <h2 className="text-xl font-semibold mb-3 tracking-tight">
          Recent Vehicles
        </h2>

        <div className="rounded-xl border bg-white overflow-hidden">
          {recentVehicles.length === 0 && (
            <div className="p-6 text-gray-500 text-sm">
              No recent vehicle activity.
            </div>
          )}

          {recentVehicles.map((v: any) => (
            <TeslaListRow
              key={v.id}
              title={`${v.year} ${v.make} ${v.model}`}
              subtitle={`Plate: ${v.plate}`}
              metaLeft={
                v.last_service_at
                  ? `Last Service: ${new Date(
                      v.last_service_at
                    ).toLocaleDateString()}`
                  : "Never Serviced"
              }
              rightIcon={false}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------
   Metric Card
------------------------------------------------------ */
function MetricCard({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <div className="text-xs text-gray-500 uppercase tracking-wider">
        {title}
      </div>
      <div className="text-2xl font-semibold mt-1">
        {value ?? "—"}
      </div>
    </div>
  );
}

/* ------------------------------------------------------
   Action Button
------------------------------------------------------ */
function ActionButton({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="
        px-4 py-2 rounded-lg 
        bg-black text-white 
        text-sm font-medium 
        hover:bg-gray-900
      "
    >
      {label}
    </a>
  );
}
