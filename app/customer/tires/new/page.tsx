"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TirePurchasePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    tire_size: "",
    tire_brand: "",
    tire_model: "",
    tire_quantity: "",
    po_number: "",
    dropoff_address: "",
  });

  const [loading, setLoading] = useState(false);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!form.tire_size) return alert("Tire size is required");
    if (!form.tire_quantity) return alert("Quantity is required");
    if (!form.dropoff_address) return alert("Dropoff address required");

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("tire_size", form.tire_size);
      fd.append("tire_brand", form.tire_brand);
      fd.append("tire_model", form.tire_model);
      fd.append("tire_quantity", form.tire_quantity);
      fd.append("po_number", form.po_number);
      fd.append("dropoff_address", form.dropoff_address);

      const res = await fetch("/api/customer/tires/create", {
        method: "POST",
        body: fd,
      });

      const js = await res.json();

      if (!js.ok) {
        alert(js.error || "Error creating tire request");
      } else {
        router.push(`/customer/requests/${js.request_id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <a
        href="/customer/requests"
        className="text-sm text-gray-500 hover:text-black"
      >
        ← Back to Requests
      </a>

      <h1 className="text-3xl font-semibold mt-4 tracking-tight">
        Tire Purchase Request
      </h1>

      <p className="text-gray-600 mt-1">
        Fill out tire details below. This creates a NEW purchase request.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">

        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium">Tire Size *</label>
            <input
              className="mt-1 w-full border px-3 py-2 rounded-lg"
              placeholder="Example: 225/75R16"
              value={form.tire_size}
              onChange={(e) => updateField("tire_size", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Brand</label>
            <input
              className="mt-1 w-full border px-3 py-2 rounded-lg"
              placeholder="Michelin, Goodyear…"
              value={form.tire_brand}
              onChange={(e) => updateField("tire_brand", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Model Number</label>
            <input
              className="mt-1 w-full border px-3 py-2 rounded-lg"
              placeholder="Optional"
              value={form.tire_model}
              onChange={(e) => updateField("tire_model", e.target.value)}
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium">Quantity *</label>
            <input
              type="number"
              className="mt-1 w-full border px-3 py-2 rounded-lg"
              placeholder="Example: 4"
              value={form.tire_quantity}
              onChange={(e) => updateField("tire_quantity", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">PO Number</label>
            <input
              className="mt-1 w-full border px-3 py-2 rounded-lg"
              placeholder="Optional PO"
              value={form.po_number}
              onChange={(e) => updateField("po_number", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Dropoff Address *</label>
            <textarea
              className="mt-1 w-full border px-3 py-2 rounded-lg"
              rows={3}
              placeholder="Where should the tires be delivered?"
              value={form.dropoff_address}
              onChange={(e) => updateField("dropoff_address", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SUBMIT */}
      <div className="mt-10">
        <button
          onClick={submit}
          disabled={loading}
          className="w-full md:w-auto bg-black text-white px-7 py-3 rounded-lg hover:bg-gray-900"
        >
          {loading ? "Submitting…" : "Submit Tire Purchase Request"}
        </button>
      </div>
    </div>
  );
}
