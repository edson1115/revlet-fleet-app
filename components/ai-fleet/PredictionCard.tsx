export function PredictionCard({ item }: { item: any }) {
  return (
    <div className="border rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition">
      <p className="text-lg font-semibold">{item.title}</p>

      <p className="text-sm text-gray-600 mt-2">{item.reason}</p>

      <div className="flex justify-between items-center mt-4">
        <span className="text-sm font-medium">
          ETA: {item.eta_days} days
        </span>
        <span className="text-xs bg-black text-white px-3 py-1 rounded-full">
          {item.risk_level}
        </span>
      </div>
    </div>
  );
}
