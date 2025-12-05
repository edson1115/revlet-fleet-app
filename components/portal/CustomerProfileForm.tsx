"use client";

import { useState } from "react";

type Profile = {
  id: string;
  name: string | null;
  billing_contact: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  secondary_contact: string | null;
  notes: string | null;
};

export default function CustomerProfileForm({
  initial,
}: {
  initial: Profile;
}) {
  const [form, setForm] = useState<Profile>(initial);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState("");

  function update<K extends keyof Profile>(key: K, val: Profile[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function save() {
    setSaving(true);
    setBanner("");
    try {
      const res = await fetch("/api/portal/customer/profile/update", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save");

      setBanner("Saved.");
    } catch (e: any) {
      setBanner(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {banner && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {banner}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Company Name">
          <input
            className="border rounded-lg px-3 py-2 text-sm w-full"
            value={form.name || ""}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>

        <Field label="Billing Contact">
          <input
            className="border rounded-lg px-3 py-2 text-sm w-full"
            value={form.billing_contact || ""}
            onChange={(e) => update("billing_contact", e.target.value)}
          />
        </Field>

        <Field label="Billing Email">
          <input
            type="email"
            className="border rounded-lg px-3 py-2 text-sm w-full"
            value={form.billing_email || ""}
            onChange={(e) => update("billing_email", e.target.value)}
          />
        </Field>

        <Field label="Billing Phone">
          <input
            className="border rounded-lg px-3 py-2 text-sm w-full"
            value={form.billing_phone || ""}
            onChange={(e) => update("billing_phone", e.target.value)}
          />
        </Field>

        <Field label="Secondary Contact">
          <input
            className="border rounded-lg px-3 py-2 text-sm w-full"
            value={form.secondary_contact || ""}
            onChange={(e) => update("secondary_contact", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          className="border rounded-lg px-3 py-2 text-sm w-full"
          rows={4}
          value={form.notes || ""}
          onChange={(e) => update("notes", e.target.value)}
        />
      </Field>

      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 text-sm disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}



