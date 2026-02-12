"use client";

export function TeslaAdminStatCard({ 
  label, 
  value 
}: { 
  label: string; 
  value: string | number; 
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}