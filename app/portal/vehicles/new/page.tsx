"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  year: string;
  make: string;
  model: string;
  plate: string;
  unit_number: string;
  vin: string;
};

export default function NewVehiclePage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    year: "",
    make: "",
    model: "",
    plate: "",
    unit_number: "",
    vin: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function upd<K extends keyof FormState>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submit() {
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/portal/vehicles", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const js = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(js?.error || "Failed to create vehicle");

      router.push("/portal/vehicles");
    } catch (e: any) {
      setErr(e?.message || "Unable to save vehicle");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Add New Vehicle</h1>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
          {err}
        </div>
      )}

      <div className="rounded-2xl border p-4 space-y-4 bg-white">
        <Field
          label="Year"
          value={form.year}
          onChange={(e) => upd("year", e.target.value)}
        />
        <Field
          label="Make"
          value={form.make}
          onChange={(e) => upd("make", e.target.value)}
        />
        <Field
          label="Model"
          value={form.model}
          onChange={(e) => upd("model", e.target.value)}
        />
        <Field
          label="License Plate"
          value={form.plate}
          onChange={(e) => upd("plate", e.target.value)}
        />
        <Field
          label="Unit Number"
          value={form.unit_number}
          onChange={(e) => upd("unit_number", e.target.value)}
        />
        <Field
          label="VIN"
          value={form.vin}
          onChange={(e) => upd("vin", e.target.value)}
        />
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save Vehicle"}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: any) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        value={value}
        onChange={onChange}
        className="w-full border rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}
