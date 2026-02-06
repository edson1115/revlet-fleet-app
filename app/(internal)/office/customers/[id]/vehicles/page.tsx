"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
// Fix: Import from the correct relative path we created earlier
import VehicleDrawer from "../drawers/VehicleDrawer";

export default function CustomerVehiclesPage() {
  const { id } = useParams<{ id: string }>();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/office/customers/${id}/vehicles`, {
        cache: "no-store",
      });
      const js = await res.json();

      if (res.ok) {
        setVehicles(js.vehicles || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto p-8">

      <Link
        href={`/office/customers/${id}`}
        className="text-sm text-gray-500 hover:text-black"
      >
        ← Back to Customer
      </Link>

      <h1 className="text-[26px] font-semibold tracking-tight mt-3 mb-2">
        Vehicles
      </h1>

      <p className="text-gray-600 text-sm mb-6">
        Vehicles belonging to this customer
      </p>

      <TeslaDivider className="mb-6" />

      {/* LIST */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading vehicles…</div>
        ) : vehicles.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No vehicles found.</div>
        ) : (
          vehicles.map((v) => (
            <TeslaListRow
              key={v.id}
              title={`${v.year} ${v.make} ${v.model}`}
              subtitle={`Unit #${v.unit_number || "—"} — Plate ${v.plate || "—"}`}
              metaLeft={`Open: ${v.open_requests} | Total: ${v.total_requests}`}
              rightIcon
              onClick={() => setSelected(v)}
            />
          ))
        )}
      </div>

      {/* DRAWER - Fixed Syntax */}
      {selected && (
        <VehicleDrawer
          {...({ vehicle: selected, onClose: () => setSelected(null) } as any)}
        />
      )}
    </div>
  );
}