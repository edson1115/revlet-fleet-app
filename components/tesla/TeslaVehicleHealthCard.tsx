"use client";

import { useEffect, useState } from "react";

export default function TeslaVehicleHealthCard({ vehicle }: { vehicle: any }) {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vehicle?.id) return;

    async function load() {
      setLoading(true);

      const res = await fetch(`/api/customer/vehicle-health?id=${vehicle.id}`, {
        cache: "no-store",
      });

      const js = await res.json();
      if (res.ok) setHealth(js.health);

      setLoading(false);
    }

    load();
  }, [vehicle?.id]);

  if (loading) {
    return (
      <div className="border p-4 rounded-xl bg-white animate-pulse">
        <p className="text-sm text-gray-500">Loading health data…</p>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="border p-4 rounded-xl bg-white">
        <p className="text-sm text-gray-500">No health data available.</p>

        <button
          className="mt-3 w-full bg-black text-white py-2 rounded-lg text-sm"
          onClick={() => alert("AI Scan coming soon")}
        >
          Run AI Scan
        </button>
      </div>
    );
  }

  return (
    <div className="border rounded-xl p-5 bg-white space-y-4">

      {/* STATUS HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Vehicle Health</h3>

        <span
          className={`px-3 py-1 text-xs rounded-lg ${
            health.status === "Good"
              ? "bg-green-100 text-green-700"
              : health.status === "Attention"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {health.status}
        </span>
      </div>

      {/* SUMMARY */}
      <p className="text-sm text-gray-600">{health.summary}</p>

      {/* Recommended Maintenance */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Recommended Maintenance</h4>

        <ul className="space-y-1 text-sm text-gray-700">
          {health.recommendations.map((item: string, i: number) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          className="flex-1 bg-black text-white py-2 rounded-lg text-sm"
          onClick={() => alert("AI Scan coming soon")}
        >
          Run AI Scan
        </button>

        <button
          className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg text-sm"
          onClick={() => alert("Full health report coming soon")}
        >
          View Report
        </button>
      </div>
    </div>
  );
}
