"use client";

const COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800 border-blue-200",
  WAITING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  WAITING_FOR_APPROVAL: "bg-orange-50 text-orange-700 border-orange-200",
  WAITING_FOR_PARTS: "bg-purple-50 text-purple-700 border-purple-200",
  SCHEDULED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  CANCELED: "bg-red-50 text-red-700 border-red-200",
};

export function TeslaStatusBadge({ status }: { status: string }) {
  // Fallback to gray if status is unknown or missing
  const cls = COLORS[status] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span
      className={`
        px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border
        ${cls}
      `}
    >
      {(status || "UNKNOWN").replace(/_/g, " ")}
    </span>
  );
}