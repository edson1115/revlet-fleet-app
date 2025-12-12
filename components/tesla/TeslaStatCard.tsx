export function TeslaStatCard({ label, value }: any) {
  return (
    <div className="bg-white rounded-xl p-6 border shadow-sm">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
