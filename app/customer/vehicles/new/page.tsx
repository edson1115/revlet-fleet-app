"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

export default function AddVehiclePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    vin: "",
    plate: "",
    make: "",
    model: "",
    year: "",
    unit_number: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    setErr(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/customer/vehicles", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(form),
      });

      const js = await res.json();
      if (!res.ok) throw new Error(js.error || "Failed to add vehicle");

      setSuccess(true);
      setTimeout(() => {
        router.push("/customer/vehicles");
      }, 600);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">
          Add Vehicle
        </h1>
        <p className="text-gray-600 text-sm">Add a new vehicle to your account.</p>
      </div>

      <TeslaDivider />

      <TeslaSection title="Vehicle Information">
        <div className="space-y-4 mt-4">
          {/* VIN */}
          <div>
            <label className="text-sm font-medium">VIN</label>
            <input
              value={form.vin}
              onChange={(e) => update("vin", e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
              placeholder="1HGBH41JXMN109186"
            />
          </div>

          {/* Plate */}
          <div>
            <label className="text-sm font-medium">Plate</label>
            <input
              value={form.plate}
              onChange={(e) => update("plate", e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
              placeholder="7ABC123"
            />
          </div>

          {/* Make / Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Make</label>
              <input
                value={form.make}
                onChange={(e) => update("make", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="Ford"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Model</label>
              <input
                value={form.model}
                onChange={(e) => update("model", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="Transit"
              />
            </div>
          </div>

          {/* Year / Unit # */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Year</label>
              <input
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="2020"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Unit #</label>
              <input
                value={form.unit_number}
                onChange={(e) => update("unit_number", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="128"
              />
            </div>
          </div>
        </div>
      </TeslaSection>

      {/* ACTIONS */}
      <div className="pt-4">
        {err && <div className="text-red-600 text-sm mb-3">{err}</div>}
        {success && (
          <div className="text-green-600 text-sm mb-3">
            Vehicle added — redirecting…
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-xl font-medium disabled:opacity-40"
        >
          {loading ? "Saving…" : "Save Vehicle"}
        </button>
      </div>
    </div>
  );
}
