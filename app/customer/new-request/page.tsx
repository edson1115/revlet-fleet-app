"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CustomerNewRequestPage() {
  const params = useSearchParams();
  const vehicleId = params.get("vehicle_id");

  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("Mechanical Issue");
  const [notes, setNotes] = useState("");

  // Load vehicle details if provided
  useEffect(() => {
    if (!vehicleId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/vehicles/${vehicleId}`);
        const js = await res.json();

        if (res.ok) setVehicle(js.vehicle);
        else console.error(js.error);
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    })();
  }, [vehicleId]);

  async function submit() {
    const body = {
      vehicle_id: vehicleId,
      request_type: type,
      notes,
    };

    const res = await fetch(`/api/customer/requests/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const js = await res.json();
    if (res.ok) {
      window.location.assign("/customer/requests");
    } else {
      alert(js.error || "Error creating request");
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create Service Request</h1>

      {/* Vehicle Summary (auto-populated) */}
      {vehicle && (
        <div className="border rounded-xl p-4 bg-white shadow-sm">
          <div className="font-semibold text-lg">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </div>
          <div className="text-sm text-gray-600">
            Unit {vehicle.unit_number} • Plate {vehicle.plate}
          </div>
        </div>
      )}

      {/* REQUEST TYPE */}
      <div>
        <label className="block text-sm font-medium">Request Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full mt-1 border rounded-lg p-2"
        >
          <option>Mechanical Issue</option>
          <option>Maintenance</option>
          <option>Inspection</option>
          <option>Tire Issue</option>
          <option>Battery Issue</option>
        </select>
      </div>

      {/* NOTES */}
      <div>
        <label className="block text-sm font-medium">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full border rounded-lg p-3"
          placeholder="Describe the issue..."
        />
      </div>

      <button
        onClick={submit}
        className="w-full bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-900"
      >
        Create Request
      </button>
    </div>
  );
}
