"use client";

import { useEffect, useState } from "react";
import VehicleDrawer from "@/components/vehicles/VehicleDrawer";
import clsx from "clsx";

export default function CustomerVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [fmcFilter, setFmcFilter] = useState<string>("all");
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);

  const [providers, setProviders] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  /* --------------------------------------------------------
     Load Vehicles
  -------------------------------------------------------- */
  async function loadVehicles() {
    setLoading(true);
    const res = await fetch("/api/customer/vehicles", { cache: "no-store" });
    const js = await res.json();
    if (js.ok) setVehicles(js.vehicles || []);
    setLoading(false);
  }

  /* --------------------------------------------------------
     Load FMC Providers
  -------------------------------------------------------- */
  useEffect(() => {
    async function loadProviders() {
      const r = await fetch("/api/providers/provider-companies");
      const js = await r.json();
      if (js.ok) setProviders(js.rows);
    }
    loadProviders();
  }, []);

  useEffect(() => {
    loadVehicles();
  }, []);

  /* --------------------------------------------------------
     Filter Logic
  -------------------------------------------------------- */
  const filteredVehicles =
    fmcFilter === "all"
      ? vehicles
      : vehicles.filter((v) => v.provider_name === fmcFilter);

  /* --------------------------------------------------------
     UI
  -------------------------------------------------------- */
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold tracking-tight">My Vehicles</h1>

        {/* VIEW TOGGLE */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm",
              viewMode === "grid"
                ? "bg-black text-white"
                : "border bg-white"
            )}
          >
            Grid
          </button>

          <button
            onClick={() => setViewMode("list")}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm",
              viewMode === "list"
                ? "bg-black text-white"
                : "border bg-white"
            )}
          >
            List
          </button>
        </div>
      </div>

      {/* FMC FILTER */}
      <div className="flex items-center gap-3 pt-2">
        <label className="text-sm font-medium">Filter by FMC:</label>

        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={fmcFilter}
          onChange={(e) => setFmcFilter(e.target.value)}
        >
          <option value="all">All Providers</option>

          {providers.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* VEHICLE VIEW */}
      {loading ? (
        <div className="text-gray-500">Loading vehicles…</div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-gray-500">No vehicles found.</div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
          {filteredVehicles.map((v) => (
            <div
              key={v.id}
              onClick={() => {
                setActiveVehicleId(v.id);
                setVehicleOpen(true);
              }}
              className="border rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition bg-white"
            >
              <h2 className="font-semibold text-lg">
                {v.year} {v.make} {v.model}
              </h2>

              <div className="text-sm text-gray-600 mt-1 space-y-1">
                <div><strong>Plate:</strong> {v.plate || "—"}</div>
                <div><strong>Unit:</strong> {v.unit_number || "—"}</div>
                {v.provider_name && (
                  <div>
                    <strong>FMC:</strong> {v.provider_name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="text-left px-4 py-3">Vehicle</th>
                <th className="text-left px-4 py-3">Plate</th>
                <th className="text-left px-4 py-3">Unit</th>
                <th className="text-left px-4 py-3">FMC</th>
              </tr>
            </thead>

            <tbody>
              {filteredVehicles.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => {
                    setActiveVehicleId(v.id);
                    setVehicleOpen(true);
                  }}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium">
                    {v.year} {v.make} {v.model}
                  </td>
                  <td className="px-4 py-3">{v.plate || "—"}</td>
                  <td className="px-4 py-3">{v.unit_number || "—"}</td>
                  <td className="px-4 py-3">{v.provider_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DRAWER */}
      {activeVehicleId && (
        <VehicleDrawer
          open={vehicleOpen}
          vehicleId={activeVehicleId}
          onClose={() => setVehicleOpen(false)}
        />
      )}
    </div>
  );
}
