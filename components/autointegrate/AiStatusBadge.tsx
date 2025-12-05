// components/autointegrate/AiStatusBadge.tsx
import React from "react";

export function AiStatusBadge({
  status,
  po,
}: {
  status?: string | null;
  po?: string | null;
}) {
  const normalized = status?.toLowerCase() || "unknown";

  const colors: Record<string, string> = {
    approved: "bg-green-100 text-green-700 border-green-300",
    declined: "bg-red-100 text-red-700 border-red-300",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
    submitted: "bg-blue-100 text-blue-700 border-blue-300",
    in_progress: "bg-purple-100 text-purple-700 border-purple-300",
    unknown: "bg-gray-100 text-gray-700 border-gray-300",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded border text-xs ${colors[normalized]}`}>
        {status || "Unknown"}
      </span>

      {po ? (
        <span className="text-xs text-gray-600">PO: {po}</span>
      ) : null}
    </div>
  );
}



