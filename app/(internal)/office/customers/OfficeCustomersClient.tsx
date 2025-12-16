"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaCustomerRow } from "@/components/tesla/office/TeslaCustomerRow";

export default function OfficeCustomersClient() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/customers/list", {
      cache: "no-store",
    });
    const js = await res.json();
    if (js.rows) setRows(js.rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <TeslaSection label="Customers">
      <div className="bg-white rounded-xl divide-y">
        {loading && (
          <div className="text-center text-gray-500 py-6">Loading…</div>
        )}

        {!loading && rows.length === 0 && (
          <div className="text-center text-gray-400 py-6">
            No customers found.
          </div>
        )}

        {rows.map((c) => (
          <TeslaCustomerRow key={c.id} customer={c} />
        ))}
      </div>
    </TeslaSection>
  );
}
