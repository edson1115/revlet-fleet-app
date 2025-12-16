"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { Save } from "lucide-react";

export default function SettingsPanel({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [billingContact, setBillingContact] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    setLoading(true);

    const r = await fetch(
      `/api/portal/customers/${customerId}/settings`,
      { cache: "no-store" }
    ).then((r) => r.json());

    setName(r.customer?.name || "");
    setBillingContact(r.customer?.billing_contact || "");
    setBillingEmail(r.customer?.billing_email || "");
    setBillingPhone(r.customer?.billing_phone || "");
    setNotes(r.customer?.notes || "");

    setLoading(false);
  }

  async function save() {
    await fetch(`/api/portal/customers/${customerId}/settings/update`, {
      method: "POST",
      body: JSON.stringify({
        name,
        billing_contact: billingContact,
        billing_email: billingEmail,
        billing_phone: billingPhone,
        notes,
      }),
    });
    load();
  }

  useEffect(() => {
    load();
  }, [customerId]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  return (
    <div className="space-y-10 max-w-xl">
      <h2 className="text-xl font-semibold">Settings</h2>

      <TeslaDivider />

      <TeslaSection label="Business Name">
        <input
          className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </TeslaSection>

      <TeslaSection label="Billing Contact">
        <input
          className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2 text-sm"
          value={billingContact}
          onChange={(e) => setBillingContact(e.target.value)}
        />
      </TeslaSection>

      <TeslaSection label="Billing Email">
        <input
          className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2 text-sm"
          value={billingEmail}
          onChange={(e) => setBillingEmail(e.target.value)}
        />
      </TeslaSection>

      <TeslaSection label="Billing Phone">
        <input
          className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2 text-sm"
          value={billingPhone}
          onChange={(e) => setBillingPhone(e.target.value)}
        />
      </TeslaSection>

      <TeslaSection label="Internal Notes">
        <textarea
          className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2 text-sm min-h-[100px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </TeslaSection>

      <button
        onClick={save}
        className="flex items-center gap-2 bg-black text-white py-3 px-4 rounded-lg text-sm hover:bg-gray-900"
      >
        <Save size={16} />
        Save Changes
      </button>
    </div>
  );
}
