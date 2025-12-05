"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";

export default function FleetHealthPanel({
  customerId,
}: {
  customerId: string;
}) {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/customers/${customerId}/health`)
      .then((r) => r.json())
      .then((d) => setMetrics(d));
  }, [customerId]);

  if (!metrics)
    return <div className="p-6 text-sm">Loading health metrics…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Fleet Health
      </h1>

      <TeslaSection label="Summary">
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-gray-600">Vehicles</div>
            <div className="text-lg font-semibold">{metrics.totalVehicles}</div>
          </div>

          <div>
            <div className="text-gray-600">Open Requests</div>
            <div className="text-lg font-semibold">{metrics.openRequests}</div>
          </div>

          <div>
            <div className="text-gray-600">Days Since Last Inspection</div>
            <div className="text-lg font-semibold">
              {metrics.daysSinceLastInspection}
            </div>
          </div>

          <div>
            <div className="text-gray-600">Health Grade</div>
            <div className="text-lg font-semibold text-indigo-600">
              {metrics.grade}
            </div>
          </div>
        </div>
      </TeslaSection>
    </div>
  );
}
