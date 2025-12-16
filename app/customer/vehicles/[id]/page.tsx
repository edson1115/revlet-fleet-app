"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CustomerVehicleDetail({ params }: any) {
  const router = useRouter();
  const { id } = params;

  const [vehicle, setVehicle] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mileage, setMileage] = useState("");
  const [savingMileage, setSavingMileage] = useState(false);
  const [aiChecking, setAiChecking] = useState(false);

  // -------------------------------------------------------
  // Load vehicle + recent service history
  // -------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        // Load vehicle
        const v = await fetch(`/api/customer/vehicles/${id}`, {
          cache: "no-store",
        }).then((r) => r.json());

        if (v.ok) {
          setVehicle(v.vehicle);
          setMileage(v.vehicle.mileage || "");
        }

        // Load last 5 service requests
        const r = await fetch(`/api/customer/requests?limit=5&vehicle_id=${id}`, {
          cache: "no-store",
        }).then((r) => r.json());

        if (r.ok) {
          setRequests(r.rows || []);
        }
      } catch (e) {
        console.error("Vehicle drawer load error", e);
      }

      setLoading(false);
    }

    load();
  }, [id]);

  // -------------------------------------------------------
  // Save mileage update
  // -------------------------------------------------------
  async function saveMileage() {
    setSavingMileage(true);

    const res = await fetch(`/api/customer/vehicles/${id}/mileage`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ mileage }),
    });

    const js = await res.json();
    setSavingMileage(false);

    if (!js.ok) {
      alert(js.error || "Failed to update mileage");
      return;
    }

    alert("Mileage updated!");
  }

  // -------------------------------------------------------
  // AI Health Check (placeholder)
  // -------------------------------------------------------
  async function runAiHealth() {
    setAiChecking(true);
    await new Promise((r) => setTimeout(r, 1500)); // simulate AI scan
    setAiChecking(false);
    alert("AI vehicle health scan complete!");
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Loading vehicle…</div>;
  }

  if (!vehicle) {
    return <div className="p-6 text-red-600">Vehicle not found.</div>;
  }

  const v = vehicle;

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-10">

      {/* HEADER */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {v.year} {v.make} {v.model}
        </h1>
        <p className="text-gray-600 text-sm">Unit #{v.unit_number || "—"}</p>
      </div>

      {/* VEHICLE INFO CARD */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-3">
        <div className="text-sm text-gray-600">Plate: {v.plate}</div>
        <div className="text-sm text-gray-600">VIN: {v.vin || "—"}</div>
        <div className="text-sm text-gray-600">Market: {v.market}</div>
        <div className="text-sm text-gray-600">
          FMC: {v.provider_name || "None"}
        </div>

        <div className="pt-3 flex gap-3">
          <Link
            href={`/customer/vehicles/${id}/edit`}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-sm"
          >
            Edit Vehicle
          </Link>

          <Link
            href={`/customer/vehicles/${id}/edit-fmc`}
            className="px-4 py-2 border text-blue-600 rounded-lg hover:bg-blue-50 text-sm"
          >
            Edit FMC
          </Link>
        </div>
      </div>

      {/* MILEAGE UPDATE */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Mileage</h2>

        <input
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
          className="border w-full p-3 rounded-lg"
          placeholder="Enter mileage"
        />

        <button
          onClick={saveMileage}
          disabled={savingMileage}
          className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
        >
          {savingMileage ? "Saving…" : "Save Mileage"}
        </button>
      </div>

      {/* AI HEALTH CHECK */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">AI Vehicle Health</h2>

        <button
          onClick={runAiHealth}
          disabled={aiChecking}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {aiChecking ? "Analyzing…" : "Run AI Health Scan"}
        </button>
      </div>

      {/* CREATE REQUEST */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">Create Service Request</h2>

        <button
          onClick={() => router.push(`/customer/requests/new?vehicle=${id}`)}
          className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          + New Service Request
        </button>
      </div>

      {/* LAST 5 SERVICE REQUESTS */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Recent Service History</h2>

        {requests.length === 0 && (
          <div className="text-sm text-gray-500">No service history found.</div>
        )}

        {requests.map((r) => (
          <div key={r.id} className="border rounded-lg p-4 bg-gray-50">
            <div className="font-semibold">{r.service}</div>

            <div className="text-sm text-gray-600">
              Status: <span className="font-medium">{r.status}</span>
            </div>

            <Link
              href={`/customer/requests/${r.id}`}
              className="text-blue-600 underline text-sm"
            >
              View →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
