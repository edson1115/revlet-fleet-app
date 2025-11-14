// app/portal/requests/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Vehicle = {
  id: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  plate?: string | null;
  unit_number?: string | null;
};

export default function CustomerNewRequestPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // form fields
  const [vehicleId, setVehicleId] = useState("");
  const [service, setService] = useState("");
  const [notes, setNotes] = useState("");
  const [mileage, setMileage] = useState("");
  const [po, setPo] = useState("");

  // load only customer vehicles (RLS will auto-filter)
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch("/api/vehicles?limit=200", {
          credentials: "include",
          cache: "no-store",
        });
        const js = await res.json();
        if (live) setVehicles(js.data || []);
      } catch {
        if (live) setVehicles([]);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  async function submit() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const body = {
        vehicle_id: vehicleId || null,
        service: service.trim(),
        notes: notes.trim() || null,
        mileage: mileage ? Number(mileage) : null,
        po: po || null,
        // customer_id + location_id auto-set by API via profile
      };

      const res = await fetch("/api/requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to create request");
      }

      const js = await res.json();
      setSuccess("Service request created!");
      setVehicleId("");
      setService("");
      setNotes("");
      setMileage("");
      setPo("");

      // redirect after success
      setTimeout(() => {
        window.location.href = "/portal/requests";
      }, 900);
    } catch (e: any) {
      setError(e.message || "Failed to create request");
    } finally {
      setSaving(false);
    }
  }

  const vehLabel = (v: Vehicle) =>
    [v.year, v.make, v.model, v.plate || v.unit_number]
      .filter(Boolean)
      .join(" ") || v.id;

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Service Request</h1>
        <Link href="/portal/requests" className="text-blue-600 underline text-sm">
          Back
        </Link>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="border border-green-200 bg-green-50 text-green-700 p-3 rounded text-sm">
          {success}
        </div>
      )}

      {/* VEHICLE SELECT */}
      <div className="space-y-1">
        <label className="text-sm text-gray-600">Vehicle</label>
        {loading ? (
          <div className="text-sm text-gray-500">Loading vehicles…</div>
        ) : vehicles.length === 0 ? (
          <div className="text-sm text-gray-500">
            No vehicles yet.
            <br />
            <Link
              href="/portal/vehicles/new"
              className="text-blue-600 underline text-sm"
            >
              Add a vehicle
            </Link>
          </div>
        ) : (
          <select
            className="border rounded-md px-3 py-2 w-full"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="">Select vehicle…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {vehLabel(v)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* SERVICE FIELD */}
      <div className="space-y-1">
        <label className="text-sm text-gray-600">Service</label>
        <input
          className="border rounded-md px-3 py-2 w-full"
          value={service}
          onChange={(e) => setService(e.target.value)}
          placeholder="Describe the service needed"
        />
      </div>

      {/* NOTES */}
      <div className="space-y-1">
        <label className="text-sm text-gray-600">Notes (optional)</label>
        <textarea
          className="border rounded-md px-3 py-2 w-full min-h-[90px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else we should know?"
        />
      </div>

      {/* MILEAGE */}
      <div className="space-y-1">
        <label className="text-sm text-gray-600">Mileage (optional)</label>
        <input
          type="number"
          className="border rounded-md px-3 py-2 w-full"
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
        />
      </div>

      {/* PO */}
      <div className="space-y-1">
        <label className="text-sm text-gray-600">PO (optional)</label>
        <input
          className="border rounded-md px-3 py-2 w-full"
          value={po}
          onChange={(e) => setPo(e.target.value)}
        />
      </div>

      {/* SUBMIT */}
      <button
        onClick={submit}
        disabled={saving}
        className="w-full py-3 rounded-md bg-black text-white font-medium hover:opacity-90 disabled:opacity-40"
      >
        {saving ? "Submitting..." : "Submit Request"}
      </button>
    </div>
  );
}
