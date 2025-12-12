"use client";

import { useState } from "react";

export default function MobileAddLeadPage() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    email: "",
    phone: "",
    visit_type: "In-Person Visit",
  });

  function update(k: string, v: string) {
    setForm({ ...form, [k]: v });
  }

  async function save() {
    setSaving(true);

    const r = await fetch("/api/sales/leads", {
      method: "POST",
      body: JSON.stringify(form),
    }).then((r) => r.json());

    setSaving(false);

    if (r.ok) window.location.href = "/mobile/sales/leads";
    else alert(r.error || "Failed");
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Add New Lead</h1>

      <input
        placeholder="Business Name"
        className="w-full p-3 rounded-lg bg-white shadow-sm"
        value={form.business_name}
        onChange={(e) => update("business_name", e.target.value)}
      />

      <input
        placeholder="Contact Name"
        className="w-full p-3 rounded-lg bg-white shadow-sm"
        value={form.contact_name}
        onChange={(e) => update("contact_name", e.target.value)}
      />

      <input
        placeholder="Email"
        className="w-full p-3 rounded-lg bg-white shadow-sm"
        value={form.email}
        onChange={(e) => update("email", e.target.value)}
      />

      <input
        placeholder="Phone"
        className="w-full p-3 rounded-lg bg-white shadow-sm"
        value={form.phone}
        onChange={(e) => update("phone", e.target.value)}
      />

      <select
        className="w-full p-3 rounded-lg bg-white shadow-sm"
        value={form.visit_type}
        onChange={(e) => update("visit_type", e.target.value)}
      >
        <option>In-Person Visit</option>
        <option>Phone</option>
        <option>Email</option>
      </select>

      <button
        onClick={save}
        className="w-full py-3 bg-black text-white rounded-lg"
      >
        {saving ? "Saving…" : "Save Lead"}
      </button>
    </div>
  );
}
