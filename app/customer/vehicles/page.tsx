"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

type Vehicle = {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  unit_number: string | null;
  plate: string | null;
};

export default function CustomerVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/customer/vehicles", { cache: "no-store" });
      const js = await res.json();

      if (!res.ok) throw new Error(js.error || "Failed to load vehicles");

      setVehicles(js.vehicles);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading)
    return <div className="text-gray-500 text-sm">Loading vehicles…</div>;

  if (err)
    return (
      <div className="text-red-600 text-sm">Unable to load vehicles: {err}</div>
    );

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>

            <a href="/customer" className="text-sm text-blue-600 underline block mb-6">
  ← Back to Portal
</a>

          <h1 className="text-[26px] font-semibold tracking-tight">
            My Vehicles
          </h1>
          <p className="text-gray-600 text-sm">
            Vehicles assigned to your fleet
          </p>
        </div>

        <Link
          href="/customer/vehicles/new"
          className="text-sm px-4 py-2 rounded-md border bg-white hover:bg-gray-50"
        >
          + Add Vehicle
        </Link>
      </div>

      <TeslaDivider />

      {/* VEHICLES LIST */}
      <TeslaSection title="All Vehicles">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {vehicles.length === 0 && (
            <div className="text-sm text-gray-600">No vehicles found.</div>
          )}

          {vehicles.map((v) => (
            <Link
              key={v.id}
              href={`/customer/vehicles/${v.id}`}
              className="border rounded-xl bg-white p-4 hover:bg-gray-100 transition"
            >
              <div className="text-lg font-semibold">
                {v.year} {v.make} {v.model}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Unit {v.unit_number} • Plate {v.plate}
              </div>
            </Link>
          ))}
        </div>
      </TeslaSection>
    </div>
  );
}
