"use client";

import { useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";

export default function NewVehiclePage() {
  const [form, setForm] = useState({
    year: "",
    make: "",
    model: "",
    plate: "",
    vin: "",
  });

  async function submit() {
    const res = await fetch("/api/customer/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const js = await res.json();
    if (!js.ok) return alert(js.error);
    window.location.href = "/customer/vehicles";
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <TeslaHeroBar title="Add Vehicle" subtitle="Enter vehicle details" />

      <div className="max-w-lg mx-auto p-6 space-y-6">
        <input
          className="w-full border rounded-xl p-3"
          placeholder="Year"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
        />

        <input
          className="w-full border rounded-xl p-3"
          placeholder="Make"
          value={form.make}
          onChange={(e) => setForm({ ...form, make: e.target.value })}
        />

        <input
          className="w-full border rounded-xl p-3"
          placeholder="Model"
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
        />

        <input
          className="w-full border rounded-xl p-3"
          placeholder="Plate"
          value={form.plate}
          onChange={(e) => setForm({ ...form, plate: e.target.value })}
        />

        <input
          className="w-full border rounded-xl p-3"
          placeholder="VIN"
          value={form.vin}
          onChange={(e) => setForm({ ...form, vin: e.target.value })}
        />

        <button
          className="w-full py-3 bg-gray-900 text-white rounded-xl"
          onClick={submit}
        >
          Save Vehicle
        </button>
      </div>
    </div>
  );
}
