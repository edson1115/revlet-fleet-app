"use client";

import { useEffect, useState } from "react";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { useRequestDrawer } from "@/lib/hooks/useRequestDrawer";

export default function OfficeRequestsList() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { open } = useRequestDrawer(); // ⭐ drawer hook

  async function load() {
    try {
      const r = await fetch("/api/requests?scope=internal", {
        cache: "no-store",
      }).then((x) => x.json());

      setRows(r.rows || []);
    } catch (e) {
      console.error("Failed to load requests", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">All Requests</h1>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {rows.map((r) => {
          const vehicle = r.vehicle || {};
          const title = `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim();

          const meta =
            vehicle.plate ||
            vehicle.vin ||
            (vehicle.unit_number ? `Unit ${vehicle.unit_number}` : "");

          return (
            <TeslaListRow
              key={r.id}
              title={title || "Vehicle"}
              subtitle={r.service ?? "—"}
              metaLeft={meta}
              status={r.status}
              onClick={() => open(r.id)} // ⭐ open Tesla drawer
            />
          );
        })}

        {rows.length === 0 && (
          <div className="p-6 text-gray-500 text-sm">No requests.</div>
        )}
      </div>
    </div>
  );
}
