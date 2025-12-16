"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditVehicleFMCPage() {
  const params = useParams();
  const id = params?.id as string;

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<any>(null);

  const [fmcs, setFmcs] = useState<any[]>([]);
  const [provider_company_id, setProviderCompanyId] = useState("");

  /* -------------------------------------------------------
     LOAD VEHICLE
  ------------------------------------------------------- */
  async function loadVehicle() {
    const r = await fetch(`/api/customer/vehicles/${id}`, {
      credentials: "include",
      cache: "no-store",
    });

    const js = await r.json();
    if (js.ok) {
      setVehicle(js.vehicle);
      setProviderCompanyId(js.vehicle.provider_company_id || "");
    }

    setLoading(false);
  }

  /* -------------------------------------------------------
     LOAD FMC PROVIDER LIST (FIXED ENDPOINT)
  ------------------------------------------------------- */
  async function loadFmcs() {
    const r = await fetch("/api/providers/provider-companies", {
      cache: "no-store",
    });

    const js = await r.json();
    if (js.ok) setFmcs(js.rows || []);
  }

  useEffect(() => {
    loadVehicle();
    loadFmcs();
  }, []);

  /* -------------------------------------------------------
     SAVE FMC
  ------------------------------------------------------- */
  async function save() {
    const r = await fetch(`/api/customer/vehicles/${id}/fmc`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        provider_company_id: provider_company_id || null,
      }),
    });

    const js = await r.json();
    if (!js.ok) return alert(js.error);
    router.push(`/customer/vehicles/${id}`);
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!vehicle) return <div className="p-6">Vehicle not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">

      <a
        href={`/customer/vehicles/${id}`}
        className="text-sm text-blue-600 underline"
      >
        ← Back to Vehicle
      </a>

      <h1 className="text-3xl font-semibold">Edit FMC</h1>

      {/* -------------------------------------------------------
          VEHICLE HEADER
      ------------------------------------------------------- */}
      <div className="bg-gray-50 border rounded-xl p-4 text-sm">
        <p className="font-semibold text-lg">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
        <p className="text-gray-600">Plate: {vehicle.plate}</p>
        <p className="text-gray-600">Unit: {vehicle.unit_number || "—"}</p>
      </div>

      {/* -------------------------------------------------------
          SELECT FMC
      ------------------------------------------------------- */}
      <div className="space-y-2">
        <label className="font-medium">Fleet Management Company (FMC)</label>

        <select
          className="w-full border p-3 rounded-lg"
          value={provider_company_id}
          onChange={(e) => setProviderCompanyId(e.target.value)}
        >
          <option value="">None</option>

          {fmcs.map((fmc) => (
            <option key={fmc.id} value={fmc.id}>
              {fmc.name}
            </option>
          ))}
        </select>
      </div>

      {/* -------------------------------------------------------
          SAVE BUTTON
      ------------------------------------------------------- */}
      <button
        onClick={save}
        className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition"
      >
        Save FMC
      </button>
    </div>
  );
}
