"use client";

export default function TeslaSection({ label, children, className = "" }) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="text-sm text-gray-600 font-semibold mb-2">{label}</div>
      )}
      <div className="rounded-xl border border-gray-200 p-4 bg-white">
        {children}
      </div>
    </div>
  );
}
