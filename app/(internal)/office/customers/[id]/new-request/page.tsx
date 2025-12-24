"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import TeslaSection from "@/components/tesla/TeslaSection";
import clsx from "clsx";

type Vehicle = {
  id: string;
  year?: number;
  make?: string;
  model?: string;
  plate?: string;
  unit_number?: string;
  vin?: string;
  market?: string;
  open_requests?: number;
  total_requests?: number;
};

export default function OfficeCustomerVehicleSelectPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/office/customers/${customerId}/vehicles`,
        { credentials: "include", cache: "no-store" }
      );
      const js = await res.json();
      setVehicles(js.vehicles ?? []);
      setLoading(false);
    }
    load();
  }, [customerId]);

  function continueWithVehicle() {
    if (!selected) return;
    router.push(
      `/office/requests/new?customer=${customerId}&vehicle=${selected}`
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">
          Select Vehicle (Walk-In / Drop-Off)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose an existing vehicle or add a new one for this customer.
        </p>
      </div>

      {/* VEHICLES */}
      <TeslaSection label="Customer Vehicles">
        {loading && (
          <div className="p-6 text-gray-500">Loading vehicles…</div>
        )}

        {!loading && vehicles.length === 0 && (
          <div className="p-6 text-gray-500">
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
                : "No unit / plate";

            return (
              <button
                key={v.id}
                onClick={() => setSelected(v.id)}
                className={clsx(
                  "p-4 rounded-xl border text-left transition",
                  selected === v.id
                    ? "border-black bg-gray-50"
                    : "hover:bg-gray-50"
                )}
              >
                <div className="font-medium">{title || "Vehicle"}</div>
                <div className="text-sm text-gray-600">{subtitle}</div>

                {v.vin && (
                  <div className="text-xs text-gray-500 mt-1">
                    VIN: {v.vin}
                  </div>
                )}

                {typeof v.open_requests === "number" && (
                  <div className="text-xs text-gray-500 mt-2">
                    Open Requests: {v.open_requests}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </TeslaSection>

      {/* ACTIONS */}
      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            router.push(
              `/office/customers/${customerId}/vehicles/new`
            )
          }
          className="text-sm px-4 py-2 rounded-lg border hover:bg-gray-50"
        >
          + Add New Vehicle
        </button>

        <button
          onClick={continueWithVehicle}
          disabled={!selected}
          className={clsx(
            "px-6 py-2 rounded-lg text-sm font-medium",
            selected
              ? "bg-black text-white hover:bg-gray-900"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          )}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
