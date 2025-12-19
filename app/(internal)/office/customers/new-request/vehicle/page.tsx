"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import TeslaSection from "@/components/tesla/TeslaSection";

type Vehicle = {
  id: string;
  year?: number;
  make?: string;
  model?: string;
  plate?: string;
  unit_number?: string;
  vin?: string;
  total_requests?: number;
  open_requests?: number;
};

export default function OfficeSelectVehiclePage() {
  const router = useRouter();
  const params = useSearchParams();
  const customerId = params.get("customerId");

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;

    async function loadVehicles() {
      const res = await fetch(
        `/api/office/customers/${customerId}/vehicles`,
        { cache: "no-store", credentials: "include" }
      );
      const js = await res.json();
      setVehicles(js.vehicles ?? []);
      setLoading(false);
    }

    loadVehicles();
  }, [customerId]);

  if (!customerId) {
    return <div className="p-8">Missing customer context.</div>;
  }

  if (loading) {
    return <div className="p-8">Loading vehicles…</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <h1 className="text-2xl font-semibold">Select Vehicle</h1>

      <p className="text-sm text-gray-600">
        Choose an existing vehicle or add a new one to continue.
      </p>

      <TeslaSection label="Existing Vehicles">
        {vehicles.length === 0 && (
          <div className="text-sm text-gray-500 p-4">
            No vehicles found for this customer.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((v) => {
            const title = `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim();
            const subtitle =
              v.unit_number
                ? `Unit ${v.unit_number}`
                : v.plate
                ? `Plate ${v.plate}`
                : v.vin
                ? `VIN ${v.vin}`
                : "—";

            return (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v.id)}
                className={`p-4 rounded-xl border text-left transition ${
                  selectedVehicle === v.id
                    ? "border-black bg-gray-50"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="font-medium">{title || "Vehicle"}</div>
                <div className="text-sm text-gray-500">{subtitle}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Open requests: {v.open_requests ?? 0}
                </div>
              </button>
            );
          })}
        </div>
      </TeslaSection>

      <TeslaSection>
        <button
          onClick={() =>
            router.push(
              `/office/customers/new-request/vehicle/new?customerId=${customerId}`
            )
          }
          className="w-full p-4 rounded-xl border-dashed border-2 text-sm hover:bg-gray-50"
        >
          ➕ Add New Vehicle
        </button>
      </TeslaSection>

      <div className="flex justify-end">
        <button
          disabled={!selectedVehicle}
          onClick={() =>
            router.push(
              `/office/customers/new-request/confirm?customerId=${customerId}&vehicleId=${selectedVehicle}`
            )
          }
          className={`px-5 py-2 rounded-lg text-sm font-medium ${
            selectedVehicle
              ? "bg-black text-white hover:bg-gray-900"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
