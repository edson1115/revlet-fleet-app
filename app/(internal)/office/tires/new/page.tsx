"use client";

import { useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";

export default function NewTireOrderPage() {
  const [size, setSize] = useState("");
  const [vendor, setVendor] = useState("");
  const [qty, setQty] = useState(4);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    setSaving(true);
    const res = await fetch("/api/tire-order/create", {
      method: "POST",
      body: JSON.stringify({
        size,
        vendor,
        qty,
        notes: note,
        market_id: "your-market-id", // later we auto-fill
      }),
    });
    const js = await res.json();
    setSaving(false);

    if (js.ok) {
      setMsg("Order Submitted!");
      setSize("");
      setVendor("");
      setQty(4);
      setNote("");
    } else {
      setMsg(js.error?.message || "Error");
    }
  }

  return (
    <div className="p-8 max-w-lg mx-auto space-y-6">
      <TeslaHeroBar title="New Tire Order" />

      <div className="bg-white p-6 rounded-xl border space-y-4">
        <div>
          <label className="text-sm">Tire Size</label>
          <input
            className="w-full mt-1 p-2 border rounded-lg"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm">Vendor</label>
          <input
            className="w-full mt-1 p-2 border rounded-lg"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm">Quantity</label>
          <input
            type="number"
            className="w-full mt-1 p-2 border rounded-lg"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="text-sm">Notes</label>
          <textarea
            className="w-full mt-1 p-2 border rounded-lg"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          disabled={saving}
          onClick={submit}
          className="px-4 py-2 bg-black text-white rounded-lg"
        >
          {saving ? "Submitting…" : "Submit Order"}
        </button>

        {msg && <p className="text-sm text-green-600">{msg}</p>}
      </div>
    </div>
  );
}
