export function TeslaLeaderboardRow({ row }: any) {
  return (
    <div className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
      <div>
        <p className="font-semibold text-gray-900">{row.market}</p>
        <p className="text-sm text-gray-500">
          {row.total_vehicles} vehicles • {row.open_requests} open requests
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">
          {row.completion_rate}% done
        </p>
        <p className="text-xs text-gray-400">last 7 days</p>
      </div>
    </div>
  );
}
