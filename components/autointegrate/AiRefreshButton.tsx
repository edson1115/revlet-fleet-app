// components/autointegrate/AiRefreshButton.tsx
"use client";

import React, { useState } from "react";

export function AiRefreshButton({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const refresh = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/autointegrate/poll", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      const js = await res.json();
      if (!res.ok) throw new Error(js.error || "Failed");

      setMsg(`Updated: ${js.aiStatus || "Unknown"}`);
    } catch (err: any) {
      setMsg(err.message || "Failed to refresh");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={refresh}
        disabled={loading}
        className="px-3 py-1 text-xs rounded border bg-white hover:bg-gray-50"
      >
        {loading ? "Refreshing…" : "Refresh AI Status"}
      </button>

      {msg ? (
        <span className="text-xs text-gray-500">{msg}</span>
      ) : null}
    </div>
  );
}



