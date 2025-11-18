// app/fm/routes/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function FMRoutePlanner() {
  const [route, setRoute] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/fm/routes/today")
      .then((r) => r.json())
      .then((res) => setRoute(res.route || []));
  }, []);

  function openGoogleMaps() {
    if (!route.length) return;

    // Build “start → stop → stop → …” link
    const points = route
      .map(
        (r) => `${r.customers.lat},${r.customers.lng}`
      )
      .join("/");

    const url = `https://www.google.com/maps/dir/${points}`;
    window.open(url, "_blank");
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">FM Route Planner</h1>

      {!route.length && (
        <p className="text-gray-500">No inspections scheduled today.</p>
      )}

      {route.length > 0 && (
        <>
          <button
            onClick={openGoogleMaps}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Start Route
          </button>

          <div className="space-y-4 mt-6">
            {route.map((r, idx) => (
              <div
                key={r.id}
                className="p-4 border rounded shadow-sm bg-white"
              >
                <p className="text-lg font-semibold">
                  Stop #{idx + 1}: {r.customers.name}
                </p>
                <p className="text-gray-600">{r.customers.address}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
