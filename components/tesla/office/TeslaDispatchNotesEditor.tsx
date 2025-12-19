"use client";

import { useState, useTransition } from "react";

export function TeslaDispatchNotesEditor({
  requestId,
  initialValue,
}: {
  requestId: string;
  initialValue?: string | null;
}) {
  const [notes, setNotes] = useState(initialValue ?? "");
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await fetch(`/api/office/requests/${requestId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dispatch_notes: notes }),
      });
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-gray-300 p-3 text-sm"
        placeholder="Add internal dispatch notes…"
      />

      <button
        onClick={save}
        disabled={isPending}
        className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save Notes"}
      </button>
    </div>
  );
}
