// components/office/ReadonlyScheduled.tsx
"use client";

type Props = {
  value?: string | null; // ISO string, nullable
  className?: string;
  label?: string;
};

function fmt(dt?: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return String(dt);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReadonlyScheduled({
  value,
  className = "",
  label = "Scheduled (dispatcher controls)",
}: Props) {
  return (
    <div className={className}>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-1 text-sm rounded-lg border px-3 py-2 bg-gray-50">
        {fmt(value)}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Dispatch assigns time & technician. Office cannot edit here.
      </p>
    </div>
  );
}
