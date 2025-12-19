import React from "react";

export function TeslaSection({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      {label && (
        <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {label}
        </h2>
      )}
      <div className="bg-white rounded-xl border border-gray-200">
        {children}
      </div>
    </section>
  );
}

// ✅ DEFENSIVE DEFAULT EXPORT (fixes Next.js resolution edge-cases)
export default TeslaSection;
