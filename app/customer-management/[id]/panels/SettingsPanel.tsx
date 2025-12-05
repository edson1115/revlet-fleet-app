"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

type Customer = {
  id: string;
  name: string;
  address?: string | null;
  approval_type: "MANAGED" | "DIRECT";
  active: boolean;
  internal_notes?: string | null;
};

export default function SettingsPanel({
  customerId,
}: {
  customerId: string;
}) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [approvalType, setApprovalType] =
    useState<"MANAGED" | "DIRECT">("MANAGED");
  const [active, setActive] = useState(true);
  const [internalNotes, setInternalNotes] = useState("");

  // Load customer
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/portal/customer/${customerId}`, {
        cache: "no-store",
      });
      const js = await res.json();
      const c = js.customer;

      setCustomer(c);
      setName(c.name);
      setAddress(c.address || "");
      setApprovalType(c.approval_type || "MANAGED");
      setActive(c.active !== false);
      setInternalNotes(c.internal_notes || "");
    }
    load();
  }, [customerId]);

  // Save changes
  async function save() {
    setSaving(true);

    await fetch(`/api/customers/${customerId}/settings/update`, {
      method: "POST",
      body: JSON.stringify({
        name,
        address,
        approval_type: approvalType,
        active,
        internal_notes: internalNotes,
      }),
    });

    setSaving(false);
    alert("Customer settings updated.");
  }

  if (!customer) {
    return <div className="text-sm p-6">Loading…</div>;
  }

  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-semibold tracking-tight">
        Settings
      </h2>

      {/* --------------------------------------------------
          NAME
      -------------------------------------------------- */}
      <TeslaSection label="Customer Name">
        <input
          className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </TeslaSection>

      {/* --------------------------------------------------
          ADDRESS
      -------------------------------------------------- */}
      <TeslaSection label="Address">
        <textarea
          className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2 text-sm min-h-[80px]"
          placeholder="Physical address (optional)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </TeslaSection>

      {/* --------------------------------------------------
          APPROVAL TYPE
      -------------------------------------------------- */}
      <TeslaSection label="Approval Type">
        <select
          value={approvalType}
          onChange={(e) =>
            setApprovalType(
              e.target.value as "MANAGED" | "DIRECT"
            )
          }
          className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2 text-sm"
        >
          <option value="MANAGED">Managed — requires approvals</option>
          <option value="DIRECT">Direct — work auto-approved</option>
        </select>
      </TeslaSection>

      {/* --------------------------------------------------
          ACTIVE / INACTIVE
      -------------------------------------------------- */}
      <TeslaSection label="Active Status">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Active Customer
          </label>
        </div>
      </TeslaSection>

      {/* --------------------------------------------------
          INTERNAL NOTES
      -------------------------------------------------- */}
      <TeslaSection label="Internal Notes">
        <textarea
          className="w-full bg-[#F5F5F5] rounded-lg px-3 py-3 text-sm min-h-[120px]"
          placeholder="Internal notes (visible only to Office / FM)"
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
        />
      </TeslaSection>

      <TeslaDivider />

      {/* --------------------------------------------------
          SAVE BUTTON
      -------------------------------------------------- */}
      <button
        onClick={save}
        disabled={saving}
        className="
          w-full py-3 bg-black text-white 
          rounded-lg text-sm font-medium 
          hover:bg-gray-900 disabled:opacity-40
        "
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>

      <div className="h-10" />
    </div>
  );
}
