"use client";

import { useEffect, useState } from "react";
import { TeslaVehicleCard } from "@/components/tesla/vehicle/TeslaVehicleCard";
import VehicleDrawerClient from "./VehicleDrawerClient";

export default function VehicleGridClient() {
  const [vehicles, setVehicles] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      const r = await fetch("/api/customer/vehicles", { cache: "no-store" });
      const js = await r.json();
      if (js.ok) setVehicles(js.vehicles);
    }
    load();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {vehicles.map((v) => (
        <TeslaVehicleCard key={v.id} vehicle={v} onClick={() => setSelected(v)} />
      ))}

      {selected && (
        <VehicleDrawerClient vehicle={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
