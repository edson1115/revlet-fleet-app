"use client";

export function HeatmapFilters({ filters, onChange }: any) {
  function update(k: string, v: any) {
    onChange({ ...filters, [k]: v });
  }

  return (
    <div className="bg-white rounded-xl shadow-xl p-3 flex gap-2 overflow-x-auto">

      <select
        value={filters.timeframe}
        onChange={(e) => update("timeframe", e.target.value)}
        className="p-2 text-sm bg-gray-100 rounded-lg"
      >
        <option value="30">30 days</option>
        <option value="60">60 days</option>
        <option value="90">90 days</option>
        <option value="365">1 year</option>
      </select>

      <select
        value={filters.market}
        onChange={(e) => update("market", e.target.value)}
        className="p-2 text-sm bg-gray-100 rounded-lg"
      >
        <option value="ALL">All Markets</option>
        <option value="San Antonio">San Antonio</option>
        <option value="NorCal">NorCal</option>
        <option value="Dallas">Dallas</option>
        <option value="Houston">Houston</option>
      </select>

      <select
        value={filters.rep}
        onChange={(e) => update("rep", e.target.value)}
        className="p-2 text-sm bg-gray-100 rounded-lg"
      >
        <option value="ALL">All Reps</option>
        <option value="1">Rep 1</option>
        <option value="2">Rep 2</option>
      </select>
    </div>
  );
}
