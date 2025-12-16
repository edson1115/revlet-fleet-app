"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditFMCPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [providerId, setProviderId] = useState("");

  useEffect(() => {
    async function load() {
      const v = await fetch(`/api/customer/vehicles/${id}`).then(r => r.json());
      const p = await fetch(`/api/providers`).then(r => r.json());

      if (v.ok) {
        setVehicle(v.vehicle);
        setProviderId(v.vehicle.provider_company_id || "");
      }
      if (p.ok) {
        setProviders(p.providers);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  async function save() {
    const r = await fetch(`/api/customer/vehicles/${id}/fmc`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ provider_company_id: providerId }),
    });

    const js = await r.json();
    if (!js.ok) return alert(js.error);

    router.push("/customer/vehicles");
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!vehicle) return <div className="p-6 text-red-500">Vehicle not found.</div>;

  return (
    <div className="max-w-xl mx-auto p-8 space-y-6 bg-white border rounded-xl shadow">
      <a href="/customer/vehicles" className="text-sm text-blue-600 underline">
        ← Back to Vehicles
      </a>

      <h1 className="text-2xl font-semibold">Edit FMC</h1>

      <p className="text-gray-600">
        {vehicle.year} {vehicle.make} {vehicle.model}
        <br />
        Plate: {vehicle.plate}
      </p>

      <div>
        <label className="block text-sm mb-2">Fleet Management Company</label>
        <select
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          className="w-full p-3 border rounded-lg"
        >
          <option value="">Select FMC</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={save}
        className="w-full bg-black text-white py-3 rounded-xl"
      >
        Save Changes
      </button>
    </div>
  );
}
