"use client";

import { useEffect, useState } from "react";

export default function CustomerRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/customer/requests", { cache: "no-store" });
      const js = await res.json();
      if (js.ok) setRequests(js.rows || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="px-6 py-12 space-y-6">
      <h2 className="text-lg font-medium text-gray-700">Your Requests</h2>

      {loading && <div className="text-gray-500">Loading…</div>}

      {!loading && requests.length === 0 && (
        <div className="w-full text-center py-10 rounded-xl bg-white shadow-sm text-gray-500">
          No service requests yet.
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r.id}
              className="p-4 bg-white rounded-xl shadow-sm flex justify-between"
            >
              <div>
                <div className="font-semibold">{r.type}</div>
                <div className="text-gray-500 text-sm">{r.status}</div>
              </div>
              <div className="text-gray-400 text-sm">{r.created_at}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
