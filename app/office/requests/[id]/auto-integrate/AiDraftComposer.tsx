// app/office/requests/[id]/auto-integrate/AiDraftComposer.tsx
"use client";

import { useState, useEffect } from "react";

type Props = {
  requestId: string;
};

export default function AiDraftComposer({ requestId }: Props) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  async function generateDraft() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/requests/${requestId}/auto-integrate-draft`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} – ${text}`);
      }

      const data = await res.json();
      setDraft(data?.draft ?? "No draft returned.");
    } catch (e: any) {
      setError(e.message || "Failed to generate draft");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Auto-load draft on page load
    generateDraft();
  }, [requestId]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="border border-red-300 bg-red-50 p-3 rounded text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-3">Generating draft…</div>
      ) : (
        <textarea
          className="w-full min-h-[400px] border rounded p-3 font-mono"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      )}

      <div className="flex gap-3">
        <button
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-40"
          onClick={generateDraft}
          disabled={loading}
        >
          {loading ? "Re-generating…" : "Regenerate Draft"}
        </button>
      </div>
    </div>
  );
}
