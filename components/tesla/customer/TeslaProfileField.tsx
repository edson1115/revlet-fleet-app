"use client";

export function TeslaProfileField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-900">
        {value || "—"}
      </div>
    </div>
  );
}
