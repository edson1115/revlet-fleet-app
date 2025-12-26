"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { TeslaSection } from "@/components/tesla/TeslaSection";

export default function OfficeAddVehicleDirectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: customerId } = use(params);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Providers State
  const [providers, setProviders] = useState<any[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  const [form, setForm] = useState({
    unit_number: "",
    year: "",
    make: "",
    model: "",
    plate: "",
    vin: "",
    provider_company_id: "", // ✅ New Field
  });

  // 1. Load Providers on Mount
  useEffect(() => {
    async function loadProviders() {
      try {
        // We assume you have a generic lookup or we query the table directly via an API
        // If this 404s, we'll create the API route next.
        const res = await fetch("/api/office/lookups/providers");
        const js = await res.json();
        if (js.ok) setProviders(js.providers);
      } catch (err) {
        console.error("Failed to load providers", err);
      } finally {
        setLoadingProviders(false);
      }
    }
    loadProviders();
  }, []);

  function updateField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!customerId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/office/customers/${customerId}/vehicles`, {
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
          provider_company_id: form.provider_company_id || null, // ✅ Send FMC ID
        }),
      });

      const js = await res.json();
      if (!res.ok || !js.ok) throw new Error(js?.error || "Failed to add vehicle");

      router.push(`/office/customers/${customerId}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 pt-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
           <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-black mb-1 block">&larr; Cancel</button>
           <h1 className="text-2xl font-bold text-black">Add Vehicle to Fleet</h1>
        </div>
      </div>

      <TeslaSection label="Vehicle Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* ✅ NEW: FMC DROPDOWN */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">FMC / Provider (Optional)</label>
            <select
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white"
              value={form.provider_company_id}
              onChange={(e) => updateField("provider_company_id", e.target.value)}
              disabled={loadingProviders}
            >
              <option value="">-- Private / None --</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <input placeholder="Unit Number" value={form.unit_number} onChange={(e) => updateField("unit_number", e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white" />
          <input placeholder="Year *" type="number" value={form.year} onChange={(e) => updateField("year", e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white" />
          <input placeholder="Make *" value={form.make} onChange={(e) => updateField("make", e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white" />
          <input placeholder="Model *" value={form.model} onChange={(e) => updateField("model", e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white" />
          <input placeholder="License Plate" value={form.plate} onChange={(e) => updateField("plate", e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white" />
          <input placeholder="VIN" value={form.vin} onChange={(e) => updateField("vin", e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white" />
        </div>
        {error && <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">{error}</div>}
      </TeslaSection>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="px-5 py-2 rounded-lg border hover:bg-gray-50 text-sm font-medium">Cancel</button>
        <button disabled={loading} onClick={handleSubmit} className="px-5 py-2 rounded-lg bg-black text-white text-sm font-bold hover:bg-gray-800 disabled:opacity-50">{loading ? "Saving…" : "Save Vehicle"}</button>
      </div>
    </div>
  );
}