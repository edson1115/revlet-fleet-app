"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import TeslaSection from "@/components/tesla/TeslaSection";
import OfficeStepHeader from "@/components/office/OfficeStepHeader";

export default function OfficeAddVehiclePage() {
  const router = useRouter();
  const params = useSearchParams();
  const customerId = params.get("customerId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    unit_number: "",
    year: "",
    make: "",
    model: "",
    plate: "",
    vin: "",
  });

  function updateField(
    key: keyof typeof form,
    value: string
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!customerId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
         `/api/office/customers/${customerId}/vehicles`,

        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unit_number: form.unit_number || null,
            year: Number(form.year),
            make: form.make,
            model: form.model,
            plate: form.plate || null,
            vin: form.vin || null,
          }),
        }
      );

      const js = await res.json();

      if (!res.ok || !js.ok) {
        throw new Error(js?.error || "Failed to add vehicle");
      }

      // ✅ Return to Select Vehicle with new data available
      router.push(
        `/office/customers/new-request/vehicle?customerId=${customerId}`
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <OfficeStepHeader
        title="Add Vehicle"
        backHref={`/office/customers/new-request/vehicle?customerId=${customerId}`}
        rightAction={{ label: "Dashboard", href: "/office" }}
      />

      <TeslaSection label="Vehicle Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Unit Number"
            value={form.unit_number}
            onChange={(e) => updateField("unit_number", e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />

          <input
            placeholder="Year *"
            value={form.year}
            onChange={(e) => updateField("year", e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />

          <input
            placeholder="Make *"
            value={form.make}
            onChange={(e) => updateField("make", e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />

          <input
            placeholder="Model *"
            value={form.model}
            onChange={(e) => updateField("model", e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />

          <input
            placeholder="License Plate"
            value={form.plate}
            onChange={(e) => updateField("plate", e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />

          <input
            placeholder="VIN"
            value={form.vin}
            onChange={(e) => updateField("vin", e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </TeslaSection>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.back()}
          className="px-5 py-2 rounded-lg border"
        >
          Cancel
        </button>

        <button
          disabled={loading}
          onClick={handleSubmit}
          className={`px-5 py-2 rounded-lg ${
            loading
              ? "bg-gray-300 text-gray-600"
              : "bg-black text-white"
          }`}
        >
          {loading ? "Saving…" : "Save Vehicle"}
        </button>
      </div>
    </div>
  );
}
