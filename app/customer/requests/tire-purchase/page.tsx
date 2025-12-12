"use client";

import { useEffect, useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";

export default function TirePurchasePage() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(4);
  const [po, setPo] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch("/api/customer/vehicles").then((r) => r.json());
    if (r.ok) setVehicles(r.vehicles);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit() {
    setSaving(true);

    const res = await fetch("/api/customer/requests/tire-purchase", {
      method: "POST",
      body: JSON.stringify({
        vehicle_id: vehicleId,
        tire_size: size,
        quantity: qty,
        po_number: po,
        location_name: location,
        notes,
      }),
    });

    const js = await res.json();
    setSaving(false);

    if (js.ok) alert("Tire Order Created!");
    else alert(js.error);
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <TeslaHeroBar
        title="Tire Purchase"
        subtitle="Order tires for a single vehicle"
      />

      <div className="max-w-4xl mx-auto p-6 space-y-8">

        <TeslaSection label="Vehicle">
          <select
            className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="">Select Vehicle</option>
            {vehicles.map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model} — {v.plate}
              </option>
            ))}
          </select>
        </TeslaSection>

        <TeslaSection label="Tire Size">
          <input
            className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2"
            placeholder="225/75R16"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </TeslaSection>

        <TeslaSection label="Quantity">
          <input
            type="number"
            className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2"
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value))}
          />
        </TeslaSection>

        <TeslaSection label="Delivery Location">
          <input
            className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2"
            placeholder="Bay 3 — Amazon DC"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </TeslaSection>

        <TeslaSection label="PO Number">
          <input
            className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2"
            placeholder="PO12345"
            value={po}
            onChange={(e) => setPo(e.target.value)}
          />
        </TeslaSection>

        <TeslaSection label="Notes (Optional)">
          <textarea
            rows={3}
            className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </TeslaSection>

        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-3 bg-black text-white rounded-xl w-full text-sm"
        >
          {saving ? "Submitting…" : "Submit Order"}
        </button>

      </div>
    </div>
  );
}
