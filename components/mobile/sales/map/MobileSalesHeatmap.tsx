"use client";

import { useState } from "react";
// import Map, { Source, Layer } from "react-map-gl"; // TODO: Uncomment after installing react-map-gl
import { HeatmapFilters } from "./HeatmapFilters";

export default function MobileSalesHeatmap() {
  const [filters, setFilters] = useState({
    type: "ALL",
    market: "ALL",
    rep: "ALL",
    timeframe: "90", // last 90 days
  });

  // Placeholder logic for map data loading (commented out to prevent unused var errors)
  /*
  const [points, setPoints] = useState([]);
  useEffect(() => {
    async function load() {
      const r = await fetch(`/api/sales/heatmap?time=${filters.timeframe}`).then((x) => x.json());
      if (r.ok) setPoints(r.points);
    }
    load();
  }, [filters]);
  */

  return (
    <div className="relative w-full h-screen bg-slate-50 flex items-center justify-center">
      {/* FILTERS */}
      <div className="absolute z-50 top-4 left-4 right-4">
        <HeatmapFilters filters={filters} onChange={setFilters} />
      </div>

      {/* MAP PLACEHOLDER */}
      <div className="text-center p-6 max-w-sm bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900">Map Component Disabled</h3>
        <p className="text-sm text-gray-500 mt-2">
          The <code>react-map-gl</code> library is missing.
        </p>
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono text-left">
          npm install react-map-gl mapbox-gl
        </div>
      </div>
    </div>
  );
}