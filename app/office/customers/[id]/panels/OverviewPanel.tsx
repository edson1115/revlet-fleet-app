"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

export default function OverviewPanel({
  customer,
  customerId,
}: {
  customer: any;
  customerId: string;
}) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/portal/customers/${customerId}`);
      const js = await res.json();

      setStats({
        vehicles: js.vehicles?.length || 0,
        requests: js.requests?.length || 0,
        active:
          js.requests?.filter(
            (r: any) =>
              r.status !== "COMPLETED" && r.status !== "CANCELED"
          ).length || 0,
        completed:
          js.requests?.filter((r: any) => r.status === "COMPLETED").length ||
          0,
      });
    })();
  }, [customerId]);

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {customer.name}
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Customer Profile & Fleet Overview
        </p>
        <TeslaDivider className="mt-4" />
      </div>

      {/* CUSTOMER INFO */}
      <TeslaSection label="Customer Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-gray-700">
          <div>
            <div className="font-medium text-gray-900 mb-1">Name</div>
            <div>{customer.name || "—"}</div>
          </div>

          <div>
            <div className="font-medium text-gray-900 mb-1">Approval Type</div>
            <div className="uppercase">{customer.approval_type || "—"}</div>
          </div>

          <div className="sm:col-span-2">
            <div className="font-medium text-gray-900 mb-1">Address</div>
            <div>{customer.address || "—"}</div>
          </div>
        </div>
      </TeslaSection>

      {/* STATS */}
      <TeslaSection label="Fleet Summary">
        {!stats ? (
          <div className="text-gray-600 text-sm">Loading…</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard label="Vehicles" value={stats.vehicles} />
            <StatCard label="Total Requests" value={stats.requests} />
            <StatCard label="Active Requests" value={stats.active} />
            <StatCard label="Completed" value={stats.completed} />
          </div>
        )}
      </TeslaSection>
    </div>
  );
}

function StatCard({ label, value }: any) {
  return (
    <div className="p-5 rounded-xl border bg-white shadow-sm">
      <div className="text-gray-500 text-xs uppercase tracking-wide">{label}</div>
      <div className="text-3xl font-semibold mt-2">{value}</div>
    </div>
  );
}
