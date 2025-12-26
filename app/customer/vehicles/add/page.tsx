"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerAddVehiclePage() {
  const router = useRouter();

  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FORM FIELDS
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [unit, setUnit] = useState("");
  const [provider, setProvider] = useState("");

  // Load FMC list
  useEffect(() => {
    async function load() {
      // Ensure this API endpoint exists or adjust path
      const r = await fetch("/api/providers/provider-companies", { cache: "no-store" });
      const js = await r.json();
      if (js.ok) setProviders(js.rows || []);
      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    if (!year || !make || !model)
      return alert("Year, make, and model required");

    const res = await fetch("/api/customer/vehicles", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        year,
        make,
        model,
        plate,
        vin,
        unit_number: unit,
        provider_company_id: provider || null,
      }),
    });

    const js = await res.json();
    if (!js.ok) return alert(js.error);

    router.push("/customer/vehicles");
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Add New Vehicle
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className="border p-3 rounded-lg" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
        <input className="border p-3 rounded-lg" placeholder="Make" value={make} onChange={(e) => setMake(e.target.value)} />
        <input className="border p-3 rounded-lg" placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
        <input className="border p-3 rounded-lg" placeholder="Plate" value={plate} onChange={(e) => setPlate(e.target.value)} />
        <input className="border p-3 rounded-lg" placeholder="VIN" value={vin} onChange={(e) => setVin(e.target.value)} />
        <input className="border p-3 rounded-lg" placeholder="Unit #" value={unit} onChange={(e) => setUnit(e.target.value)} />
      </div>

      {/* FMC DROPDOWN */}
      <div>
        <label className="font-medium text-sm">Fleet Management Company (Optional)</label>
        <select
          className="w-full border p-3 rounded-lg mt-1"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          <option value="">None / Private</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <button
        onClick={save}
        className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition"
      >
        Save Vehicle to Fleet
      </button>
    </div>
  );
}