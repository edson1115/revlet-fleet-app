"use client";

import { useState, useTransition } from "react";

export function TeslaOfficeInternalForm({
  requestId,
  approvalNumber,
  invoiceNumber,
  officeNotes,
}: {
  requestId: string;
  approvalNumber?: string | null;
  invoiceNumber?: string | null;
  officeNotes?: string | null;
}) {
  const [approval, setApproval] = useState(approvalNumber ?? "");
  const [invoice, setInvoice] = useState(invoiceNumber ?? "");
  const [notes, setNotes] = useState(officeNotes ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await fetch(`/api/office/requests/${requestId}/office`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approval_number: approval,
          invoice_number: invoice,
          office_notes: notes,
        }),
      });
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-gray-600">
          Approval Number
        </label>
        <input
          value={approval}
          onChange={(e) => setApproval(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600">
          Invoice Number
        </label>
        <input
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600">
          Office Notes (Internal)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-black text-white text-sm"
        >
          {pending ? "Saving..." : "Save Office Info"}
        </button>

        {saved && (
          <span className="text-xs text-green-600">
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
