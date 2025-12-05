// components/tesla/TeslaStatusTag.tsx
"use client";

type Props = { status: string };

export function TeslaStatusTag({ status }: Props) {
  const s = status?.toUpperCase() ?? "";

  // --- Tesla Color Map (Option C - your choice) ---
  const map: Record<string, string> = {
    NEW: "bg-gray-100 text-gray-700 border-gray-300",
    WAITING_TO_BE_SCHEDULED: "bg-gray-100 text-gray-700 border-gray-300",

    WAITING_FOR_PARTS: "bg-yellow-100 text-yellow-800 border-yellow-300",
    WAITING_FOR_APPROVAL: "bg-yellow-100 text-yellow-800 border-yellow-300",

    SCHEDULED: "bg-blue-100 text-blue-800 border-blue-300",
    IN_PROGRESS: "bg-black text-white border-black",
    COMPLETED: "bg-green-100 text-green-800 border-green-300",
  };

  const cls =
    map[s] ??
    "bg-gray-100 text-gray-700 border-gray-300"; // fallback (safe default)

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 border text-xs rounded-md font-medium ${cls}`}
    >
      {s.replace(/_/g, " ")}
    </span>
  );
}
