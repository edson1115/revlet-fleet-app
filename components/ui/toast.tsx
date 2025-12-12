"use client";

export function Toast({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="bg-black text-white px-4 py-3 rounded-xl shadow-lg w-64">
      {title && <div className="font-semibold">{title}</div>}
      {description && (
        <div className="text-sm text-gray-300 mt-1">{description}</div>
      )}
    </div>
  );
}
