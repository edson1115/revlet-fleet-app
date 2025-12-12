"use client";

import { useState } from "react";

export function TeslaLeadUpdatePanel({ leadId, onRefresh }: any) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/sales/leads/${leadId}/update`, {
      method: "POST",
      body: JSON.stringify({ message: text }),
    });

    setSaving(false);
    setText("");
    onRefresh();
  }

  return (
    <div className="p-6 bg-white rounded-xl border space-y-3">
      <h3 className="font-semibold text-lg">Add Update</h3>

      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-[#f5f5f5] rounded-lg p-3 text-sm"
        placeholder="Visit notes, update, or follow-up..."
      />

      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 bg-black text-white rounded-lg text-sm"
      >
        {saving ? "Saving…" : "Add Update"}
      </button>
    </div>
  );
}
