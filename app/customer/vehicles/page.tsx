"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Added router
import VehicleDrawer from "@/components/vehicles/VehicleDrawer";
import clsx from "clsx";

export default function CustomerVehiclesPage() {
  const router = useRouter(); // ✅ Init router
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
      {/* HEADER WITH BUTTONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">My Vehicles</h1>

        <div className="flex items-center gap-3">
            {/* VIEW TOGGLE */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setViewMode("grid")}
                    className={clsx(
                    "px-3 py-1.5 rounded-md text-xs font-bold transition",
                    viewMode === "grid" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"
                    )}
                >
                    Grid
                </button>
                <button
                    onClick={() => setViewMode("list")}
                    className={clsx(
                    "px-3 py-1.5 rounded-md text-xs font-bold transition",
                    viewMode === "list" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"
                    )}
                >
                    List
                </button>
            </div>

            {/* ✅ ADD VEHICLE BUTTON RESTORED */}
            <button 
                onClick={() => router.push("/customer/vehicles/add")}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition flex items-center gap-2"
            >
                <span>+</span> Add Vehicle
            </button>
        </div>
      </div>

      {/* FMC FILTER */}
      <div className="flex items-center gap-3 pt-2">
        <label className="text-sm font-medium">Filter by FMC:</label>

        <select
          className="border rounded-lg px-3 py-2 text-sm bg-white"
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
        <div className="text-gray-500 p-12 text-center">Loading vehicles…</div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-xl">
            <div className="text-gray-500 mb-4">No vehicles found in your fleet.</div>
            <button 
                onClick={() => router.push("/customer/vehicles/add")}
                className="text-blue-600 font-bold hover:underline"
            >
                Add your first vehicle
            </button>
        </div>
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
              className="border rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-black transition bg-white group"
            >
              <div className="flex justify-between items-start mb-2">
                 <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600 group-hover:bg-black group-hover:text-white transition">
                    {v.unit_number ? `UNIT ${v.unit_number}` : "NO UNIT"}
                 </span>
                 <span className="text-xs text-gray-400 font-mono border px-1.5 py-0.5 rounded">
                    {v.plate || "NO PLATE"}
                 </span>
              </div>
              
              <h2 className="font-bold text-lg text-gray-900">
                {v.year} {v.make} {v.model}
              </h2>

              {v.provider_name && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Managed By</div>
                    <div className="text-sm font-medium text-blue-600">{v.provider_name}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
              <tr>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Plate</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">FMC</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredVehicles.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => {
                    setActiveVehicleId(v.id);
                    setVehicleOpen(true);
                  }}
                  className="hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {v.year} {v.make} {v.model}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-500">{v.plate || "—"}</td>
                  <td className="px-6 py-4 font-bold text-gray-700">{v.unit_number || "—"}</td>
                  <td className="px-6 py-4 text-blue-600 font-medium">{v.provider_name || "—"}</td>
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