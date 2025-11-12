"use client";

import React, { useState } from "react";

export default function CustomerCreateRequestPage() {
  const [vehicleId, setVehicleId] = useState<string>("");
  const [newVehicle, setNewVehicle] = useState({
    unit_number: "",
    year: "",
    make: "",
    model: "",
    plate: "",
    fmc: "",
    notes: "",
  });
  const [service, setService] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const body: any = {
        // backend will infer customer + location from logged-in user
        service,
        notes: notes || null,
      };

      if (vehicleId) {
        body.vehicle_id = vehicleId;
      } else if (newVehicle.make || newVehicle.model || newVehicle.plate) {
        body.new_vehicle = {
          unit_number: newVehicle.unit_number || null,
          year: newVehicle.year ? Number(newVehicle.year) : null,
          make: newVehicle.make || null,
          model: newVehicle.model || null,
          plate: newVehicle.plate || null,
          fmc: newVehicle.fmc || null,
          notes: newVehicle.notes || null,
        };
      }

      const res = await fetch("/api/requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const js = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(js?.error || res.statusText);

      setSuccess(true);
      // optionally redirect to "My Requests" page
    } catch (e: any) {
      setError(e?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-2">
        Create Service Request
      </h1>
      <p className="text-sm text-gray-600 mb-4">
        Select a vehicle or add a new one, then describe the issue. Your office will review and schedule as needed.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* TODO: replace this with real vehicle dropdown loaded for this customer */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Vehicle
          </label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="">+ Add new vehicle</option>
            {/* map existing vehicles here */}
          </select>
        </div>

        {!vehicleId && (
          <div className="space-y-2 border rounded-lg p-3">
            <div className="text-xs font-semibold text-gray-700">
              New vehicle details
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="border rounded px-2 py-1 text-sm"
                placeholder="Unit #"
                value={newVehicle.unit_number}
                onChange={(e) =>
                  setNewVehicle((v) => ({ ...v, unit_number: e.target.value }))
                }
              />
              <input
                className="border rounded px-2 py-1 text-sm"
                placeholder="Year"
                value={newVehicle.year}
                onChange={(e) =>
                  setNewVehicle((v) => ({ ...v, year: e.target.value }))
                }
              />
              <input
                className="border rounded px-2 py-1 text-sm"
                placeholder="Make"
                value={newVehicle.make}
                onChange={(e) =>
                  setNewVehicle((v) => ({ ...v, make: e.target.value }))
                }
              />
              <input
                className="border rounded px-2 py-1 text-sm"
                placeholder="Model"
                value={newVehicle.model}
                onChange={(e) =>
                  setNewVehicle((v) => ({ ...v, model: e.target.value }))
                }
              />
              <input
                className="border rounded px-2 py-1 text-sm"
                placeholder="Plate"
                value={newVehicle.plate}
                onChange={(e) =>
                  setNewVehicle((v) => ({ ...v, plate: e.target.value }))
                }
              />
              <input
                className="border rounded px-2 py-1 text-sm"
                placeholder="FMC (optional)"
                value={newVehicle.fmc}
                onChange={(e) =>
                  setNewVehicle((v) => ({ ...v, fmc: e.target.value }))
                }
              />
            </div>
            <textarea
              className="w-full border rounded px-2 py-1 text-sm"
              rows={2}
              placeholder="Internal notes about this vehicle (optional)"
              value={newVehicle.notes}
              onChange={(e) =>
                setNewVehicle((v) => ({ ...v, notes: e.target.value }))
              }
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            Service needed
          </label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="Describe the issue or requested service"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Notes (optional)
          </label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else the office/dispatch/tech should know"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-emerald-600">
            Request submitted. Office will review and schedule if needed.
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !service}
          className="mt-2 px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit request"}
        </button>
      </form>
    </div>
  );
}
