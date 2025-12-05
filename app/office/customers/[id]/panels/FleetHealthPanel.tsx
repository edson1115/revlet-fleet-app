"use client";

import { useEffect, useState } from "react";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

export default function FleetHealthPanel({
  customerId,
}: {
  customerId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<any>(null);

  async function load() {
    setLoading(true);

    const res = await fetch(
      `/api/portal/customers/${customerId}/health`,
      { cache: "no-store" }
    ).then((r) => r.json());

    setHealth(res);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [customerId]);

  if (loading) {
    return <p className="text-gray-500 text-sm">Loading health…</p>;
  }

  if (!health) {
    return <p className="text-gray-500 text-sm">No data.</p>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-xl font-semibold">Revlet Grade</h2>

      <TeslaDivider />

      <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-xl border">
        <div>
          <p className="text-gray-600 text-sm">Vehicles</p>
          <p className="font-semibold text-lg">{health.totalVehicles}</p>
        </div>

        <div>
          <p className="text-gray-600 text-sm">Open Requests</p>
          <p className="font-semibold text-lg">{health.openRequests}</p>
        </div>

        <div>
          <p className="text-gray-600 text-sm">Days Since Last Inspection</p>
          <p className="font-semibold text-lg">
            {health.daysSinceLastInspection}
          </p>
        </div>

        <div>
          <p className="text-gray-600 text-sm">Revlet Grade</p>
          <p className="font-bold text-indigo-600 text-xl">
            {health.grade}
          </p>
        </div>
      </div>
    </div>
  );
}
