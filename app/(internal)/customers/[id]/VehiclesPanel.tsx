"use client";

import { useEffect, useState } from "react";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import VehicleDrawer from "@/components/vehicles/VehicleDrawer";

export default function VehiclesPanel({
  customerId,
  onOpenLightbox,
}: {
  customerId: string;
  onOpenLightbox?: (imgs: any[], i: number) => void;
}) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);

  async function load() {
    const r = await fetch(`/api/portal/customer/${customerId}/vehicles`, {
      cache: "no-store",
    }).then((x) => x.json());

    setVehicles(r.rows || []);
  }

  useEffect(() => {
    load();
  }, [customerId]);

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-semibold tracking-tight">Vehicles</h1>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {vehicles.map((v) => (
          <TeslaListRow
            key={v.id}
            title={`${v.year} ${v.make} ${v.model}`}
            subtitle={v.unit_number}
            metaLeft={v.plate}
            rightIcon
            onClick={() => setActive(v)}
          />
        ))}

        {vehicles.length === 0 && (
          <div className="p-6 text-gray-500 text-sm">
            No vehicles found.
          </div>
        )}
      </div>

      {active && (
        <VehicleDrawer
          vehicle={active}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}
