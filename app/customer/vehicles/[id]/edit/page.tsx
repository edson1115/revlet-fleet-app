"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id;

  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    year: "",
    make: "",
    model: "",
    plate: "",
    unit_number: "",
    vin: "",
  });

  // -------------------------------------------------------
  // LOAD VEHICLE
  // -------------------------------------------------------
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/customer/vehicles/${vehicleId}`, {
        credentials: "include",
        cache: "no-store",
      });

      const js = await res.json();
      if (js.ok && js.vehicle) {
        const v = js.vehicle;

        setVehicle(v);

        setForm({
          year: v.year || "",
          make: v.make || "",
          model: v.model || "",
          plate: v.plate || "",
          unit_number: v.unit_number || "",
          vin: v.vin || "",
        });
      }
      setLoading(false);
    }

    load();
  }, [vehicleId]);

  // -------------------------------------------------------
  // SAVE CHANGES
  // -------------------------------------------------------
  async function save() {
    setSaving(true);

    const res = await fetch(`/api/customer/vehicles/${vehicleId}`, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify(form),
    });

    const js = await res.json();
    setSaving(false);

    if (!js.ok && js.error) {
      alert(js.error);
      return;
    }

    router.push(`/customer/vehicles/${vehicleId}`);
  }

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  if (loading) {
    return <div className="p-6 text-gray-500">Loading vehicle…</div>;
  }

  if (!vehicle) {
    return (
      <div className="p-6 text-red-600">
        Vehicle not found or you do not have access.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-10 space-y-10">

      <div>
        <h1 className="text-3xl font-semibold">Edit Vehicle</h1>
        <p className="text-gray-500">Update your vehicle information below.</p>
      </div>

      <div className="bg-white p-8 border rounded-2xl shadow-sm space-y-6">

        {/* Year */}
        <Field
          label="Year"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
        />

        {/* Make */}
        <Field
          label="Make"
          value={form.make}
          onChange={(e) => setForm({ ...form, make: e.target.value })}
        />

        {/* Model */}
        <Field
          label="Model"
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
        />

        {/* Plate */}
        <Field
          label="Plate"
          value={form.plate}
          onChange={(e) => setForm({ ...form, plate: e.target.value })}
        />

        {/* Unit */}
        <Field
          label="Unit Number"
          value={form.unit_number}
          onChange={(e) => setForm({ ...form, unit_number: e.target.value })}
        />

        {/* VIN */}
        <Field
          label="VIN"
          value={form.vin}
          onChange={(e) => setForm({ ...form, vin: e.target.value })}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <button
          onClick={() => router.push(`/customer/vehicles/${vehicleId}`)}
          className="px-5 py-3 rounded-lg border hover:bg-gray-100 transition"
        >
          Cancel
        </button>

        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-3 rounded-lg bg-black text-white hover:bg-gray-800 transition"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   UI Helper
------------------------------------------------------- */
function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: any;
  onChange: any;
}) {
  return (
    <div className="space-y-2">
      <label className="font-medium">{label}</label>
      <input
        value={value}
        onChange={onChange}
        className="w-full border p-3 rounded-lg"
      />
    </div>
  );
}
