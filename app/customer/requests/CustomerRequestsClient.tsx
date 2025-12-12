"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaCustomerRequestRow } from "@/components/tesla/customer/TeslaCustomerRequestRow";

export default function CustomerRequestsClient() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/customer/requests", { cache: "no-store" });
      const js = await res.json();
      setRows(js.rows ?? []); // ⭐ Prevents undefined.length crash
      setLoading(false);
    }
    load();
  }, []);

  return (
    <TeslaSection label="Your Requests">
      <div className="bg-white rounded-xl divide-y">
        {loading && (
          <div className="text-center text-gray-500 py-6">Loading…</div>
        )}

        {!loading && rows.length === 0 && (
          <div className="text-center text-gray-400 py-6">
            No service requests yet.
          </div>
        )}

        {rows.map((r) => (
          <TeslaCustomerRequestRow key={r.id} req={r} />
        ))}
      </div>
    </TeslaSection>
  );
}
