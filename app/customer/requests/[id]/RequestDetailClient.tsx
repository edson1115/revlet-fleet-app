"use client";

import { useEffect, useState } from "react";

export default function RequestDetailClient({ id }: { id: string }) {
  const [req, setReq] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/customer/requests/${id}`);
      const js = await res.json();
      setReq(js.request ?? null);
    }
    load();
  }, [id]);

  if (!req) return <div className="p-6 text-gray-500">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">{req.vehicle_plate}</h2>
      <p className="text-sm text-gray-600">{req.description}</p>

      <div className="text-xs text-gray-400">
        Status: {req.status}
        <br />
        Last updated: {req.updated_at}
      </div>
    </div>
  );
}
