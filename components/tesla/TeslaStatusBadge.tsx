"use client";

const COLORS = {
  NEW: "bg-blue-100 text-blue-700 border-blue-200",
  WAITING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  "WAITING_FOR_APPROVAL": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "WAITING_FOR_PARTS": "bg-orange-100 text-orange-700 border-orange-200",
  SCHEDULED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  IN_PROGRESS: "bg-purple-100 text-purple-700 border-purple-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
};

export function TeslaStatusBadge({ status }) {
  const cls = COLORS[status] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${cls}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
