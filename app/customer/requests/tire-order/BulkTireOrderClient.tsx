"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";

export default function BulkTireOrderClient() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [fleetName, setFleetName] = useState("");
  const [po, setPo] = useState("");
  const [delivery, setDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadVehicles() {
    const r = await fetch("/api/customer/vehicles", { cache: "no-store" }).then(
      (r) => r.json()
    );
    if (r.ok) setVehicles(r.vehicles || []);
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  function addItem() {
    setItems([
      ...items,
      {
        id: Date.now(),
        vehicle_id: "",
        tire_size: "",
        quantity: 1,
      },
    ]);
  }

  function updateItem(idx: number, key: string, value: any) {
    const next = [...items];
    next[idx][key] = value;
    setItems(next);
  }

  async function submit() {
    setSaving(true);

    const res = await fetch("/api/customer/requests/tire-order", {
      method: "POST",
      body: JSON.stringify({
        fleet_name: fleetName,
        order_items: items,
        po_number: po,
        delivery_timeframe: delivery,
        notes,
      }),
    });

    const js = await res.json();
    setSaving(false);

    if (js.ok) {
      alert("Order submitted!");
      setItems([]);
    } else {
      alert(js.error || "Something went wrong.");
    }
  }

  return (
    <div className="space-y-8">

      <TeslaSection label="Fleet Name">
        <input
          type="text"
          className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2 text-sm"
          placeholder="Amazon DSP – Bay 3"
          value={fleetName}
          onChange={(e) => setFleetName(e.target.value)}
        />
      </TeslaSection>

      <TeslaSection label="Order Items">
        <div className="space-y-4">

          {items.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 bg-white rounded-xl border space-y-4"
            >
              {/* Vehicle */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Vehicle</div>
                <select
                  className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2"
                  value={item.vehicle_id}
                  onChange={(e) =>
                    updateItem(idx, "vehicle_id", e.target.value)
                  }
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} — {v.plate}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tire Size */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Tire Size</div>
                <input
                  className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2"
                  value={item.tire_size}
                  onChange={(e) =>
                    updateItem(idx, "tire_size", e.target.value)
                  }
                  placeholder="225/75R16"
                />
              </div>

              {/* Quantity */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Quantity</div>
                <input
                  type="number"
                  className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(idx, "quantity", parseInt(e.target.value))
                  }
                />
              </div>
            </div>
          ))}

          <button
            onClick={addItem}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm"
          >
            + Add Vehicle Tire Set
          </button>
        </div>
      </TeslaSection>

      {/* Delivery */}
      <TeslaSection label="Delivery Window">
        <input
          type="text"
          className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2 text-sm"
          placeholder="Tomorrow before 10AM"
          value={delivery}
          onChange={(e) => setDelivery(e.target.value)}
        />
      </TeslaSection>

      {/* PO */}
      <TeslaSection label="PO Number">
        <input
          type="text"
          className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2 text-sm"
          placeholder="PO12345"
          value={po}
          onChange={(e) => setPo(e.target.value)}
        />
      </TeslaSection>

      {/* Notes */}
      <TeslaSection label="Notes (Optional)">
        <textarea
          rows={3}
          className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </TeslaSection>

      <button
        onClick={submit}
        disabled={saving}
        className="px-4 py-3 bg-black text-white rounded-xl text-sm w-full"
      >
        {saving ? "Submitting…" : "Submit Tire Order"}
      </button>
    </div>
  );
}
