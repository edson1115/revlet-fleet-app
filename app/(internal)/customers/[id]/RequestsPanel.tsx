"use client";

import { useEffect, useState } from "react";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import Lightbox from "@/components/common/Lightbox";

export default function RequestsPanel({
  customerId,
}: {
  customerId: string;
}) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await fetch(`/api/portal/customer/${customerId}/requests`, {
      cache: "no-store",
    }).then((x) => x.json());

    setRequests(r.rows || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [customerId]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Service Requests
      </h1>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {requests.map((r) => (
          <TeslaListRow
            key={r.id}
            title={`${r.vehicle?.year} ${r.vehicle?.make} ${r.vehicle?.model}`}
            subtitle={r.service}
            metaLeft={`Requested: ${new Date(r.date_requested).toLocaleDateString()}`}
            status={r.status}
            onClick={() =>
              window.location.assign(`/office/requests/${r.id}`)
            }
          />
        ))}

        {requests.length === 0 && (
          <div className="p-6 text-gray-500 text-sm">No requests yet.</div>
        )}
      </div>
    </div>
  );
}
