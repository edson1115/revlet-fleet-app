"use client";

import { useState } from "react";
// import Map, { Source, Layer } from "react-map-gl"; // TODO: Uncomment after installing react-map-gl
import { MapFilters } from "./MapFilters";
import { Map as MapIcon } from "lucide-react";

export default function MobileSalesMap() {
  const [filters, setFilters] = useState({
    market: "ALL",
    rep: "ALL",
  });

  // Placeholder logic for map data loading (commented out to prevent unused var errors)
  /*
  const [points, setPoints] = useState([]);
  
  async function load() {
    const r = await fetch("/api/sales/map-data", { cache: "no-store" }).then(
      (r) => r.json()
    );

    if (r.ok) {
       // ... processing logic
      setPoints(all);
    }
  }

  useEffect(() => {
    load();
  }, []);
  */

  return (
    <div className="relative w-full h-screen bg-slate-50 flex items-center justify-center">
      <div className="absolute top-4 left-4 right-4 z-10">
        <MapFilters filters={filters} onChange={setFilters} />
      </div>

      {/* MAP PLACEHOLDER */}
      <div className="text-center p-6 max-w-sm bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <MapIcon className="w-6 h-6 text-gray-400" />
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