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
    setSaving(true);

    const res = await fetch(
      `/api/office/requests/${request.id}/office-fields`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          po,
          invoice_number: invoice,
          office_notes: officeNotes,
        }),
      }
    );

    const js = await res.json();
    setSaving(false);

    if (!res.ok) {
      alert(js.error || "Failed to save office fields");
    }
  }

  return (
    <TeslaSection label="Office Internal">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

        <TeslaInput
          label="PO Number"
          value={po}
          onChange={(e: any) => setPo(e.target.value)}
        />

        <TeslaInput
          label="Invoice Number"
          value={invoice}
          onChange={(e: any) => setInvoice(e.target.value)}
        />

        <div className="md:col-span-2">
          <TeslaInput
            as="textarea"
            rows={4}
            label="Office Notes"
            value={officeNotes}
            onChange={(e: any) => setOfficeNotes(e.target.value)}
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
