"use client";

import { useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import TeslaInput from "@/components/tesla/TeslaInput";
import TeslaButton from "@/components/tesla/TeslaButton";

export function OfficeFieldsSection({ request }: { request: any }) {
  const [po, setPo] = useState(request.po || "");
  const [invoice, setInvoice] = useState(request.invoice_number || "");
  const [officeNotes, setOfficeNotes] = useState(request.office_notes || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);

    try {
      const res = await fetch(
        `/api/office/requests/${request.id}/office-fields`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            po,
            invoice_number: invoice,
            office_notes: officeNotes,
          }),
        }
      );

      const js = await res.json();

      if (!res.ok) {
        alert(js?.error || "Failed to save office fields");
      }
    } catch (err) {
      console.error("Save office fields failed:", err);
      alert("Unexpected error saving office fields");
    } finally {
      setSaving(false);
    }
  }

  return (
    <TeslaSection label="Office Internal">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* PO NUMBER */}
        <TeslaInput
          label="PO Number"
          value={po}
          onChange={(e: any) => setPo(e.target.value)}
        />

        {/* INVOICE NUMBER */}
        <TeslaInput
          label="Invoice Number"
          value={invoice}
          onChange={(e: any) => setInvoice(e.target.value)}
        />

        {/* OFFICE NOTES — NATIVE TEXTAREA (CRITICAL FIX) */}
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600 font-medium px-1 mb-1 block">
            Office Notes
          </label>

          <textarea
            rows={4}
            value={officeNotes}
            onChange={(e) => setOfficeNotes(e.target.value)}
            className="
              w-full border border-gray-300 rounded-xl px-4 py-2
              text-sm focus:outline-none focus:ring-[2px]
              focus:ring-black transition-all
            "
          />
        </div>
      </div>

      <div className="mt-4">
        <TeslaButton onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Office Fields"}
        </TeslaButton>
      </div>
    </TeslaSection>
  );
}
