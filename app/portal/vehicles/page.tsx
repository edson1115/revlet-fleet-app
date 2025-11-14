"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

type Vehicle = {
  id: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  plate?: string | null;
  unit_number?: string | null;
  vin?: string | null;
  location_id?: string | null;
  location?: { id: string; name?: string | null } | null;
};

type RequestLite = {
  id: string;
  vehicle_id: string;
  status: string;
};

function vehLabel(v: Vehicle) {
  return [
    v.year,
    v.make,
    v.model,
    v.plate || v.unit_number,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function CustomerVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [requests, setRequests] = useState<RequestLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let live = true;

    async function loadAll() {
      setLoading(true);

      try {
        // Vehicles
        const resV = await fetch(`/api/portal/vehicles`, {
          credentials: "include",
          cache: "no-store",
        });
        const jsV = await resV.json();

        // Requests (pull all for customer and match by vehicle)
        const resR = await fetch(
          `/api/requests?limit=1000&sortBy=created_at&sortDir=desc`,
          { credentials: "include", cache: "no-store" }
        );
        const jsR = await resR.json();

        if (!live) return;

        setVehicles(jsV?.vehicles || []);
        setRequests(jsR?.rows || []);
      } catch {
        if (!live) {
          return;
        }
        setVehicles([]);
        setRequests([]);
      } finally {
        if (live) setLoading(false);
      }
    }

    loadAll();
    return () => {
      live = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return vehicles;
    const q = query.trim().toLowerCase();
    return vehicles.filter((v) => {
      const str =
        `${v.year} ${v.make} ${v.model} ${v.plate} ${v.unit_number} ${v.vin}`
          .toLowerCase()
          .trim();
      return str.includes(q);
    });
  }, [vehicles, query]);

  function countActive(vehicleId: string) {
    return requests.filter(
      (r) =>
        r.vehicle_id === vehicleId &&
        ["NEW", "SCHEDULED", "IN PROGRESS"].includes(
          r.status.toUpperCase()
        )
    ).length;
  }

  return (
    <div className="p-6 mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vehicles</h1>
      </div>

      {/* Search Bar */}
      <div>
        <input
          type="text"
          placeholder="Search (unit, plate, VIN, make, model)…"
          className="w-full border rounded-lg px-3 py-2 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Body */}
      {loading ? (
        <div className="text-gray-500">Loading vehicles…</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500">No vehicles found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => {
            const activeCount = countActive(v.id);

            return (
              <Link
                key={v.id}
                href={`/portal/vehicles/${v.id}`}
                className="block rounded-2xl border bg-white p-4 hover:shadow transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-sm">
                    {vehLabel(v) || "Vehicle"}
                  </div>
                  {activeCount > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full border border-amber-300">
                      {activeCount} open request
                      {activeCount === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  VIN: {v.vin || "—"}
                </div>
                {v.location?.name && (
                  <div className="text-xs text-gray-500">
                    Location: {v.location.name}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
