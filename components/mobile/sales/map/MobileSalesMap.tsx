"use client";

import { useEffect, useState } from "react";
import Map, { Source, Layer } from "react-map-gl";
import { LeadPin } from "./LeadPin";
import { CustomerPin } from "./CustomerPin";
import { MapFilters } from "./MapFilters";

export default function MobileSalesMap() {
  const [points, setPoints] = useState([]);
  const [filters, setFilters] = useState({
    market: "ALL",
    rep: "ALL",
  });

  async function load() {
    const r = await fetch("/api/sales/map-data", { cache: "no-store" }).then(
      (r) => r.json()
    );

    if (r.ok) {
      // combine leads + customers
      const all = [];

      for (const l of r.leads) {
        all.push({
          type: "Feature",
          properties: {
            type: "lead",
            id: l.id,
            created_at: l.created_at,
            rep: l.sales_rep_id,
          },
          geometry: { type: "Point", coordinates: [l.lng, l.lat] },
        });
      }

      for (const c of r.customers) {
        all.push({
          type: "Feature",
          properties: {
            type: "customer",
            id: c.id,
            total_spend: c.total_spend,
          },
          geometry: { type: "Point", coordinates: [c.lng, c.lat] },
        });
      }

      setPoints(all);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const geojson = {
    type: "FeatureCollection",
    features: points,
  };

  return (
    <div className="relative w-full h-screen">
      <MapFilters filters={filters} onChange={setFilters} />

      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          longitude: -98.5,
          latitude: 29.4,
          zoom: 7,
        }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        style={{ width: "100%", height: "100%" }}
      >
        {/* CLUSTER SOURCE */}
        <Source
          id="sales-points"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={60}
        >
          {/* CLUSTER CIRCLES */}
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": [
                "step",
                ["get", "point_count"],
                "#51bbd6",
                10,
                "#f1f075",
                25,
                "#f28cb1",
              ],
              "circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 25, 40],
            }}
          />

          {/* CLUSTER COUNT LABELS */}
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": "{point_count_abbreviated}",
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 12,
            }}
          />

          {/* UNCLUSTERED POINTS */}
          <Layer
            id="unclustered-point"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": "#11b4da",
              "circle-radius": 6,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#fff",
            }}
          />
        </Source>
      </Map>
    </div>
  );
}
