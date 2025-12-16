"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditVehicleFmcPage({ params }: any) {
  const router = useRouter();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [vehicle, setVehicle] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [providerCompanyId, setProviderCompanyId] = useState("");

  // -------------------------------------------------------
  // Load vehicle + FMC provider list
  // -------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const vRes = await fetch(`/api/customer/vehicles/${id}`, {
          cache: "no-store",
        });
        const vJs = await vRes.json();

        if (vJs.ok) {
          setVehicle(vJs.vehicle);
          setProviderCompanyId(vJs.vehicle.provider_company_id || "");
        }

        const pRes = await fetch("/api/providers/provider-companies", {
          cache: "no-store",
        });
        const pJs = await pRes.json();
        if (pJs.ok) setProviders(pJs.rows);
      } catch (err) {
        console.error("Error loading edit-fmc page:", err);
      }

      setLoading(false);
    }

    load();
  }, [id]);

  // -------------------------------------------------------
  // SAVE FMC UPDATE
  // -------------------------------------------------------
  async function save() {
    if (!providerCompanyId) {
      alert("Please select an FMC.");
      return;
    }

    setSaving(true);

    const r = await fetch(`/api/customer/vehicles/${id}/fmc`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ provider_company_id: providerCompanyId }),
    });

    const js = await r.json();
    setSaving(false);

    if (!js.ok) {
      alert(js.error || "Failed to save FMC");
      return;
    }

    router.push("/customer/vehicles/fmc");
  }

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  if (loading) {
    return <div className="p-6 text-gray-500">Loading vehicle…</div>;
  }

  if (!vehicle) {
    return <div className="p-6 text-red-600">Vehicle not found.</div>;
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10 space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Edit FMC
      </h1>

      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-3">
        <div className="text-lg font-semibold">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </div>

        <div className="text-sm text-gray-600">Plate: {vehicle.plate}</div>
        <div className="text-sm text-gray-600">Unit: {vehicle.unit_number || "—"}</div>
      </div>

      {/* FMC CHOICE */}
      <div className="space-y-2">
        <label className="font-medium">Fleet Management Company</label>
        <select
          className="w-full border p-3 rounded-lg"
          value={providerCompanyId}
          onChange={(e) => setProviderCompanyId(e.target.value)}
        >
          <option value="">None</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* ACTION BUTTON */}
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
