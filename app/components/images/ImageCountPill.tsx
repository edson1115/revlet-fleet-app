// components/images/ImageCountPill.tsx
"use client";

export default function ImageCountPill({
  total,
  before = 0,
  after = 0,
  other = 0,
  onClick,
  title,
  className = "",
}: {
  total: number;
  before?: number;
  after?: number;
  other?: number;
  onClick?: () => void;
  title?: string;
  className?: string;
}) {
  const tone =
    total === 0 ? "bg-gray-100 text-gray-600 border-gray-200"
    : before > 0 && after > 0 ? "bg-green-50 text-green-700 border-green-200"
    : "bg-yellow-50 text-yellow-700 border-yellow-200";

  const label = total === 0 ? "0" : `${total}`;

  const tooltip =
    title ??
    (total === 0
      ? "No photos yet"
      : `Photos: ${total} (before ${before}, after ${after}${other ? `, other ${other}` : ""})`);

  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${tone} ${className}`}
    >
      <span aria-hidden>📷</span>
      <span className="tabular-nums">{label}</span>
    </button>
  );
}
