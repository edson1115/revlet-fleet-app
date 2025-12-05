"use client";

import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import VehicleDrawer from "../drawers/VehicleDrawer";

export default function VehiclesPanel({
  customerId,
}: {
  customerId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const [drawerVehicle, setDrawerVehicle] = useState<any>(null);

  async function load() {
    setLoading(true);

    const r = await fetch(
      `/api/portal/customers/${customerId}/vehicles`,
      { cache: "no-store" }
    ).then((r) => r.json());

    setVehicles(r.vehicles || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [customerId]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Vehicles</h2>

        <button
          onClick={load}
          className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg text-sm hover:bg-gray-200"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}

      {!loading && vehicles.length === 0 && (
        <p className="text-gray-500 text-sm">No vehicles found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {vehicles.map((v) => (
          <button
            key={v.id}
            onClick={() => setDrawerVehicle(v)}
            className="p-4 bg-white rounded-xl border hover:shadow-md transition text-left"
          >
            <p className="font-medium">
              {v.year} {v.make} {v.model}
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Plate: {v.plate || "—"}
            </p>
            <p className="text-gray-600 text-sm">
              VIN: {v.vin?.slice(0, 8)}…
            </p>
          </button>
        ))}
      </div>

      {drawerVehicle && (
        <VehicleDrawer
          vehicle={drawerVehicle}
          onClose={() => setDrawerVehicle(null)}
        />
      )}
    </div>
  );
}
