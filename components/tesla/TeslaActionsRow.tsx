"use client";

import { useState } from "react";

export default function TeslaActionsRow({
  requestId,
  currentStatus,
  onAction,
}: {
  requestId: string;
  currentStatus: string;
  onAction?: (type: string, payload?: any) => void;
}) {
  const [loading, setLoading] = useState("");

  async function act(type: string, extra?: any) {
    setLoading(type);

    try {
      await fetch("/api/requests/batch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: type,
          ids: [requestId],
          ...extra,
        }),
      });

      onAction?.(type, extra);
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="pt-5 mt-6 border-t border-gray-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        
        {/* LEFT SIDE BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => act("reopen")}
            disabled={loading === "reopen"}
            className="px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {loading === "reopen" ? "Processing…" : "Reopen"}
          </button>

          <button
            onClick={() => act("needs_review")}
            disabled={loading === "needs_review"}
            className="px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {loading === "needs_review" ? "Processing…" : "Needs Review"}
          </button>

          <button
            onClick={() => act("decline")}
            disabled={loading === "decline"}
            className="px-4 py-3 rounded-lg border border-red-300 bg-red-50 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {loading === "decline" ? "Processing…" : "Decline"}
          </button>
        </div>

        {/* PRIMARY ACTION */}
        <button
          onClick={() => act("send_to_tech")}
          disabled={loading === "send_to_tech"}
          className="
            px-6 py-3 rounded-lg
            bg-black text-white
            text-sm font-medium
            hover:bg-gray-800
            disabled:opacity-50
          "
        >
          {loading === "send_to_tech"
            ? "Sending…"
            : "Send to Technician"}
        </button>
      </div>
    </div>
  );
}
