// components/request/RequestNotesPanel.tsx
"use client";

import { useState } from "react";

type Props = {
  id: string;
  notes: string | null;
  dispatchNotes: string | null;
  refresh: () => void;
};

export default function RequestNotesPanel({
  id,
  notes,
  dispatchNotes,
  refresh,
}: Props) {
  const [text, setText] = useState("");

  async function add() {
    if (!text.trim()) return;

    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_notes",
        dispatch_notes: (dispatchNotes || "") + "\n" + text,
      }),
    });

    setText("");
    refresh();
  }

  async function summarize() {
    const r = await fetch("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: dispatchNotes || notes || "" }),
    });

    const js = await r.json();
    setText(js.summary || "");
  }

  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm space-y-3">
      <div className="text-xs uppercase text-gray-500">Notes</div>

      <div className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-xl border">
        {dispatchNotes || notes || "No notes added"}
      </div>

      <textarea
        className="w-full border rounded-xl p-2 min-h-20"
        placeholder="Add note..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex gap-2">
        <button
          onClick={add}
          className="flex-1 bg-black text-white py-2 rounded-xl"
        >
          Add Note
        </button>

        <button
          onClick={summarize}
          className="px-4 py-2 rounded-xl border text-sm"
        >
          AI Summary
        </button>
      </div>
    </div>
  );
}
