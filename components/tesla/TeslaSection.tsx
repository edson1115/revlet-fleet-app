"use client";

export function TeslaSection({ label, children }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">{label}</h2>
      {children}
    </section>
  );
}
