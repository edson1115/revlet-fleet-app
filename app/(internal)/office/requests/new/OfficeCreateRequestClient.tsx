"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TeslaSection } from "@/components/tesla/TeslaSection";

export default function OfficeCreateRequestClient({
  preselectedCustomer,
}: {
  preselectedCustomer: any;
}) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [mileage, setMileage] = useState(""); // ✅ New Mileage State

  // Load fleet
  useEffect(() => {
    if (preselectedCustomer?.id) {
      setLoadingVehicles(true);
      fetch(`/api/office/customers/${preselectedCustomer.id}/vehicles`)
        .then((res) => res.json())
        .then((js) => {
          if (js.ok) setVehicles(js.vehicles);
        })
        .finally(() => setLoadingVehicles(false));
    }
  }, [preselectedCustomer]);

  async function handleSubmit() {
    // Validation: Title is required
    if (!selectedVehicleId) {
      alert("Please select a vehicle.");
      return;
    }
    if (!serviceTitle.trim()) {
      alert("Please enter a Service Title (e.g. 'Oil Change').");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/office/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: preselectedCustomer.id,
          vehicle_id: selectedVehicleId,
          service_title: serviceTitle,
          service_description: serviceDesc,
          reported_mileage: mileage ? parseInt(mileage.replace(/,/g, "")) : null, // ✅ Send Mileage
          status: "NEW",
          created_by_role: "OFFICE"
        }),
      });

      if (!res.ok) throw new Error("Failed to create request");

      router.push(`/office/customers/${preselectedCustomer.id}`);
      router.refresh();
    } catch (err) {
      alert("Error creating request");
      console.error(err);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-6">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-black">
          &larr; Cancel
        </button>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold">New Request for {preselectedCustomer?.name}</h1>
      </div>

      {/* 1. SELECT VEHICLE */}
      <TeslaSection label="Select Vehicle">
        {loadingVehicles ? (
          <div className="text-sm text-gray-500">Loading fleet...</div>
        ) : vehicles.length === 0 ? (
          <div className="text-sm text-red-500">
            This customer has no vehicles. Add a vehicle first.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vehicles.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className={`p-4 border rounded-xl cursor-pointer transition ${
                  selectedVehicleId === v.id
                    ? "border-black bg-gray-50 ring-1 ring-black"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="font-bold text-sm">
                  {v.unit_number ? `Unit ${v.unit_number}` : "No Unit #"}
                </div>
                <div className="text-xs text-gray-600">
                  {v.year} {v.make} {v.model}
                </div>
                <div className="text-xs text-gray-400 font-mono mt-1">
                  {v.plate || "NO PLATE"}
                </div>
              </div>
            ))}
          </div>
        )}
      </TeslaSection>

      {/* 2. DEFINE SERVICE */}
      <TeslaSection label="Service Definition">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Service Title <span className="text-red-500">*</span>
            </label>
            <input
              placeholder="e.g. 50k Service, Tire Replacement"
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              className="w-full border-b border-gray-300 py-2 focus:border-black outline-none text-lg font-medium"
            />
          </div>

          {/* ✅ MILEAGE INPUT */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Current Mileage
            </label>
            <input
              type="number"
              placeholder="e.g. 54020"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full border-b border-gray-300 py-2 focus:border-black outline-none text-lg font-medium"
            />
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Instructions / Notes
            </label>
            <textarea
              placeholder="Internal notes for the technician..."
              value={serviceDesc}
              onChange={(e) => setServiceDesc(e.target.value)}
              rows={3}
              className="w-full p-3 bg-gray-50 rounded-lg text-sm border border-gray-200"
            />
          </div>
        </div>
      </TeslaSection>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedVehicleId}
          className="bg-black text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition shadow-lg"
        >
          {submitting ? "Creating..." : "Create Request"}
        </button>
      </div>
    </div>
  );
}