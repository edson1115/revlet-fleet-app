"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import TeslaSection from "@/components/tesla/TeslaSection";
import OfficeStepHeader from "@/components/office/OfficeStepHeader";

type Vehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  unit_number?: string | null;
  plate?: string | null;
  vin?: string | null;
};

export default function OfficeSelectVehiclePage() {
  const router = useRouter();
  const params = useSearchParams();
  const customerId = params.get("customerId");

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  /* -------------------------------------------------
     LOAD CUSTOMER NAME
  ------------------------------------------------- */
  useEffect(() => {
    if (!customerId) return;

    fetch(`/api/office/customers/${customerId}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.customer?.name) {
          setCustomerName(d.customer.name);
        }
      })
      .catch(() => setCustomerName(null));
  }, [customerId]);

  /* -------------------------------------------------
     LOAD VEHICLES
  ------------------------------------------------- */
  useEffect(() => {
    if (!customerId) return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/office/customers/${customerId}/vehicles`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const js = await res.json();
        setVehicles(js?.vehicles ?? []);
      } catch (err) {
        console.error("Failed to load vehicles", err);
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [customerId]);

  /* -------------------------------------------------
     FILTERED VEHICLES
  ------------------------------------------------- */
  const filteredVehicles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles;

    return vehicles.filter((v) => {
      return (
        v.unit_number?.toLowerCase().includes(q) ||
        v.plate?.toLowerCase().includes(q) ||
        v.vin?.toLowerCase().includes(q) ||
        `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(q)
      );
    });
  }, [vehicles, query]);

  /* -------------------------------------------------
     RENDER
  ------------------------------------------------- */
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <OfficeStepHeader
        title="Select Vehicle"
        backHref="/office/customers/new-request"
      />

      {/* CUSTOMER CONTEXT */}
      {customerName && (
        <div className="text-sm text-gray-600">
          Vehicles for{" "}
          <span className="font-semibold text-gray-900">
            {customerName}
          </span>
        </div>
      )}

      <TeslaSection label="Existing Vehicles">
        {/* SEARCH + ADD */}
        <div className="flex items-center gap-3 mb-4">
          {vehicles.length > 0 && (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by unit, plate, VIN, or vehicle"
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
          )}

          <button
            onClick={() =>
              router.push(
                `/office/customers/new-request/add-vehicle?customerId=${customerId}`
              )
            }
            className="inline-flex items-center px-4 py-2 rounded-lg bg-black text-white text-sm"
          >
            ➕ Add Vehicle
          </button>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-sm text-gray-500">
            Loading vehicles…
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && vehicles.length === 0 && (
          <div className="text-sm text-gray-500">
            No vehicles found for this customer.
          </div>
        )}

        {/* VEHICLE LIST */}
        {!loading && filteredVehicles.length > 0 && (
          <div className="divide-y rounded-xl border">
            {filteredVehicles.map((v) => {
              const selected = selectedVehicleId === v.id;

              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`w-full text-left px-4 py-3 transition ${
                    selected ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  {/* UNIT NUMBER – PRIMARY */}
                  <div className="font-semibold text-sm">
                    {v.unit_number || "No Unit Number"}
                  </div>

                  {/* YEAR / MAKE / MODEL */}
                  <div className="text-sm text-gray-700">
                    {v.year} {v.make} {v.model}
                  </div>

                  {/* LICENSE PLATE */}
                  {v.plate && (
                    <div className="text-xs text-gray-500">
                      Plate: {v.plate}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </TeslaSection>

      {/* CONTINUE */}
      <div className="flex justify-end">
        <button
          disabled={!selectedVehicleId}
          onClick={() =>
            router.push(
              `/office/customers/new-request/details?customerId=${customerId}&vehicleId=${selectedVehicleId}`
            )
          }
          className={`px-5 py-2 rounded-lg ${
            selectedVehicleId
              ? "bg-black text-white"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
