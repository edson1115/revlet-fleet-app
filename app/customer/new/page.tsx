// app/customer/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function NewCustomerServiceRequest() {
  const params = useSearchParams();
  const vehicleId = params.get("vehicle_id"); // ← Pre-filled from drawer

  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState<any>(null);

  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");

  // ---------------------------------------------
  // LOAD VEHICLE IF PREFILLED
  // ---------------------------------------------
  useEffect(() => {
    if (!vehicleId) return;

    async function load() {
      const res = await fetch(`/api/customer/vehicles/${vehicleId}`, {
        cache: "no-store",
      });
      const js = await res.json();
      if (res.ok) {
        setVehicle(js.vehicle);
      }
    }

    load();
  }, [vehicleId]);

  // ---------------------------------------------
  // CREATE REQUEST
  // ---------------------------------------------
  async function submit() {
    if (loading) return;

    if (!serviceType.trim()) {
      alert("Please enter a service type.");
      return;
    }

    setLoading(true);

    const payload = {
      vehicle_id: vehicleId || null,
      service_type: serviceType,
      description,
    };

    const res = await fetch("/api/customer/requests/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const js = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(js.error || "Failed to create request");
      return;
    }

    alert("Service Request Created.");
    window.location.href = "/customer/requests";
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">
          Create Service Request
        </h1>

        {vehicle && (
          <p className="text-sm text-gray-600 mt-1">
            Vehicle: <strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong>  
            (Plate: {vehicle.plate || "—"})
          </p>
        )}
      </div>

      {/* SERVICE TYPE */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Service Type
        </label>
        <input
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          placeholder="Example: Oil Change, Brakes, Diagnosis"
          className="border rounded-lg px-3 py-2 w-full bg-gray-50"
        />
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full h-28 bg-gray-50"
          placeholder="Describe any issues, noises, leaks, warning lights, etc."
        />
      </div>

      {/* BUTTONS */}
      <div className="flex gap-4">
        <button
          onClick={submit}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40"
        >
          {loading ? "Creating…" : "Create Request"}
        </button>

        <Link
          href="/customer/requests"
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
