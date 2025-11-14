"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function postJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Request failed");
  }
  return res.json() as Promise<T>;
}

export default function EditCustomerProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [billingContact, setBillingContact] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [secondaryContact, setSecondaryContact] = useState("");
  const [notes, setNotes] = useState("");

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load existing data
  useState(() => {
    (async () => {
      try {
        const res = await fetch("/api/portal/profile", {
          credentials: "include",
          cache: "no-store",
        });
        const js = await res.json();
        setName(js.name || "");
        setBillingContact(js.billing_contact || "");
        setBillingEmail(js.billing_email || "");
        setBillingPhone(js.billing_phone || "");
        setSecondaryContact(js.secondary_contact || "");
        setNotes(js.notes || "");
      } catch (e: any) {
        setErr(e.message || "Failed to load");
      } finally {
        setLoaded(true);
      }
    })();
  });

  async function save() {
    setBusy(true);
    setErr("");
    try {
      await postJSON("/api/portal/profile/update", {
        name,
        billing_contact: billingContact,
        billing_email: billingEmail,
        billing_phone: billingPhone,
        secondary_contact: secondaryContact,
        notes,
      });
      router.push("/portal/profile");
    } catch (e: any) {
      setErr(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-2xl font-semibold">Edit Profile</h1>

      {err && (
        <div className="border border-red-300 bg-red-50 text-red-700 p-3 rounded text-sm">
          {err}
        </div>
      )}

      <div className="rounded-2xl border p-6 bg-white shadow-sm space-y-5">
        {[
          ["Company Name", name, setName],
          ["Billing Contact", billingContact, setBillingContact],
          ["Billing Email", billingEmail, setBillingEmail],
          ["Billing Phone", billingPhone, setBillingPhone],
          ["Secondary Contact", secondaryContact, setSecondaryContact],
        ].map(([label, val, setter]) => (
          <label key={label} className="block text-sm space-y-1">
            <span className="text-gray-600">{label}</span>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={val as string}
              onChange={(e) => (setter as any)(e.target.value)}
              disabled={busy}
            />
          </label>
        ))}

        <label className="block text-sm space-y-1">
          <span className="text-gray-600">Notes</span>
          <textarea
            className="border rounded-md px-3 py-2 w-full min-h-[120px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={busy}
          />
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          className="px-4 py-2 border rounded"
          onClick={() => router.push("/portal/profile")}
          disabled={busy}
        >
          Cancel
        </button>

        <button
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-40"
          onClick={save}
          disabled={busy}
        >
          {busy ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
