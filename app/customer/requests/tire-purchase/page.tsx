"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import TeslaSection from "@/components/tesla/TeslaSection";

export default function TirePurchasePage() {
  const router = useRouter();

  const [size, setSize] = useState("");
  const [qty, setQty] = useState(4);
  const [po, setPo] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!size || qty <= 0) {
      alert("Please enter tire size and quantity.");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/customer/requests/tire-purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tire_size: size,
        quantity: qty,
        po_number: po || null,
        location_name: location || null,
        notes: notes || null,
      }),
    });

    const js = await res.json();
    setSaving(false);

    if (js.ok && js.request?.id) {
      // ✅ Auto-redirect to request detail
      router.push(`/customer/requests/${js.request.id}`);
    } else {
      alert(js.error || "Failed to submit tire order.");
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <TeslaHeroBar
        title="Tire Purchase"
        subtitle="Order tires for your fleet"
      />

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <TeslaSection label="Tire Details">
          <input
            className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2"
            placeholder="Tire size, brand, model (ex: 235/65R16 Aspen)"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </TeslaSection>

        <TeslaSection label="Quantity">
          <input
            type="number"
            min={1}
            className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2"
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value || "0"))}
          />
        </TeslaSection>

        <TeslaSection label="Delivery Location">
          <input
            className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2"
            placeholder="Warehouse, dock door, contact name"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </TeslaSection>

        <TeslaSection label="PO Number (Optional)">
          <input
            className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2"
            placeholder="PO number if applicable"
            value={po}
            onChange={(e) => setPo(e.target.value)}
          />
        </TeslaSection>

        <TeslaSection label="Notes (Optional)">
          <textarea
            rows={3}
            className="w-full bg-[#f5f5f5] rounded-lg px-3 py-2"
            placeholder="Any special instructions or comments"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </TeslaSection>

        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-3 bg-black text-white rounded-xl w-full text-sm disabled:opacity-60"
        >
          {saving ? "Submitting…" : "Submit Tire Order"}
        </button>
      </div>
    </div>
  );
}
