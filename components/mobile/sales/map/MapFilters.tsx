"use client";

export function MapFilters({ filters, onChange }: any) {
  function update(k: string, v: string) {
    onChange({ ...filters, [k]: v });
  }

  return (
    <div className="bg-white p-3 rounded-xl shadow-lg flex gap-2 overflow-x-auto">

      <select
        value={filters.type}
        className="p-2 text-sm bg-gray-100 rounded-lg"
        onChange={(e) => update("type", e.target.value)}
      >
        <option value="ALL">All</option>
        <option value="LEADS">Leads</option>
        <option value="CUSTOMERS">Customers</option>
      </select>

      <select
        value={filters.market}
        className="p-2 text-sm bg-gray-100 rounded-lg"
        onChange={(e) => update("market", e.target.value)}
      >
        <option value="ALL">All Markets</option>
        <option value="San Antonio">San Antonio</option>
        <option value="NorCal">NorCal</option>
        <option value="Houston">Houston</option>
        <option value="Dallas">Dallas</option>
      </select>

      <select
        value={filters.rep}
        className="p-2 text-sm bg-gray-100 rounded-lg"
        onChange={(e) => update("rep", e.target.value)}
      >
        <option value="ALL">All Reps</option>
        <option value="rep_1">Rep 1</option>
        <option value="rep_2">Rep 2</option>
      </select>

    </div>
  );
}
