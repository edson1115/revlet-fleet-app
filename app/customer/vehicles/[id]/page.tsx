"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import VehicleBrainDrawer from "@/components/ai-fleet/VehicleBrainDrawer";

export default function CustomerVehicleDetailPage({ params }: any) {
  // params is now a Promise — unwrap it:
  const { id } = use(params);

  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);


  async function load() {
    try {
      const res = await fetch(`/api/customer/vehicles/${id}`, {
        cache: "no-store",
        credentials: "include",
      });

      const js = await res.json();
      if (!res.ok) throw new Error(js.error);

      setVehicle(js.vehicle);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  // --- AUTO GROUP ---
  async function autoAssignGroup() {
    const res = await fetch("/api/ai/vehicles/group", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ vehicle_id: id }),
    });

    const js = await res.json();
    if (!res.ok) return alert(js.error);

    alert(`Assigned group: ${js.group_name}`);
    load(); // refresh UI
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!vehicle) return <div className="p-6">Vehicle not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-10">
      <a href="/customer/vehicles" className="text-sm text-blue-600 underline">
        ← Back to Vehicles
      </a>

      <h1 className="text-3xl font-semibold">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h1>

      <p className="text-gray-600">
        Unit {vehicle.unit_number} • Plate {vehicle.plate}
      </p>

      {/* GROUP NAME */}
      <div className="p-4 bg-gray-50 rounded-xl border">
        <p className="text-sm text-gray-500">Group</p>
        <p className="font-medium">{vehicle.group_name || "—"}</p>

        <button
          onClick={autoAssignGroup}
          className="mt-3 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
        >
          Auto-Assign Group
        </button>
      </div>

      <button
        onClick={() => setDrawerOpen(true)}
        className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-900"
      >
        Open Vehicle AI Brain
      </button>

      {/* Drawer Component */}
      <VehicleBrainDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        vehicleId={id}
      />
    </div>
  );
}
