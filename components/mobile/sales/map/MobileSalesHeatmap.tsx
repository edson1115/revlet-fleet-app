"use client";

import { useEffect, useState } from "react";
import Map, { Source, Layer } from "react-map-gl";
import { HeatmapFilters } from "./HeatmapFilters";

export default function MobileSalesHeatmap() {
  const [points, setPoints] = useState([]);
  const [filters, setFilters] = useState({
    type: "ALL",
    market: "ALL",
    rep: "ALL",
    timeframe: "90", // last 90 days
  });

  async function load() {
    const r = await fetch(`/api/sales/heatmap?time=${filters.timeframe}`, {
      cache: "no-store",
    }).then((x) => x.json());

    if (r.ok) setPoints(r.points);
  }

  useEffect(() => {
    load();
  }, [filters]);

  const heatmapData = {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      properties: {
        weight: p.weight,
      },
      geometry: {
        type: "Point",
        coordinates: [p.lng, p.lat],
      },
    })),
  };

  return (
    <div className="relative w-full h-screen">

      {/* FILTERS */}
      <div className="absolute z-50 top-4 left-4 right-4">
        <HeatmapFilters filters={filters} onChange={setFilters} />
      </div>

      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          longitude: -98.5,
          latitude: 29.4,
          zoom: 7,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        <Source id="sales-heat" type="geojson" data={heatmapData}>
          <Layer
            id="heatmap-layer"
            type="heatmap"
            paint={{
              "heatmap-radius": 40,
              "heatmap-opacity": 0.9,
              "heatmap-weight": ["get", "weight"],
              "heatmap-intensity": 1.2,
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0,
                "rgba(0,0,255,0)",
                0.2,
                "#2c7bb6",
                0.4,
                "#abd9e9",
                0.6,
                "#ffffbf",
                0.8,
                "#fdae61",
                1,
                "#d7191c",
              ],
            }}
          />
        </Source>
      </Map>
    </div>
  );
}
