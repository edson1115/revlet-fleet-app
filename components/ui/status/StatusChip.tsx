"use client";

import { STATUS_COLORS, STATUS_LABELS } from "./status-map";

export function StatusChip({ status }: { status: string }) {
  const key = status.toUpperCase() as keyof typeof STATUS_COLORS;
  const cfg = STATUS_COLORS[key];

  if (!cfg) {
    return (
      <span className="px-3 py-1 rounded-full text-xs bg-gray-200 text-gray-600">
        {status}
      </span>
    );
  }

  return (
  <span
    className="px-3 py-1 rounded-full text-xs font-medium animate-fade-in"
    style={{
      backgroundColor: cfg.bg,
      color: cfg.text,
      border: `1px solid ${cfg.border}`,
    }}
  >
    {STATUS_LABELS[key] ?? status}
  </span>
);

}



