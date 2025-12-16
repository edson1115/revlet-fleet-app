"use client";

import { useEffect, useState } from "react";

export default function NewRequestClient() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields:
  const [vehicleId, setVehicleId] = useState("");
  const [service, setService] = useState("");
  const [notes, setNotes] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [keyDrop, setKeyDrop] = useState(false);

  useEffect(() => {
    async function loadVehicles() {
      try {
        const r = await fetch("/api/customer/vehicles", {
          cache: "no-store",
          credentials: "include",
        });
        const js = await r.json();
        if (js.ok) setVehicles(js.vehicles || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadVehicles();
  }, []);

  async function submit() {
    const payload = {
      vehicle_id: vehicleId,
      service,
      notes,
      urgent,
      key_drop: keyDrop,
    };

    const r = await fetch("/api/customer/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const js = await r.json();
    if (js.ok) {
      window.location.href = "/customer/requests";
    } else {
      alert("Error: " + js.error);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Create Service Request</h1>

      {/* Vehicle Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Vehicle</label>
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="border rounded-lg p-3 w-full"
        >
          <option value="">Select Vehicle</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.year} {v.make} {v.model} — {v.plate}
            </option>
          ))}
        </select>
      </div>

      {/* Service */}
      <div>
        <label className="block text-sm font-medium mb-2">Service</label>
        <input
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="border rounded-lg p-3 w-full"
          placeholder="Oil Change, Brakes, Inspection..."
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border rounded-lg p-3 w-full"
          rows={4}
          placeholder="Describe the issue or request…"
        ></textarea>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
          />
          Urgent
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={keyDrop}
            onChange={(e) => setKeyDrop(e.target.checked)}
          />
          Key Drop
        </label>
      </div>

      {/* Submit */}
      <button
        onClick={submit}
        className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-900 transition"
      >
        Submit Request
      </button>
    </div>
  );
}
