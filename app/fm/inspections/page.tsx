// app/fm/inspections/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FMInspectionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/fm/inspections/today")
      .then((r) => r.json())
      .then((res) => setItems(res || []));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-2">Inspections Today</h1>

      <p className="text-gray-600 mb-4">
        These inspections are automatically generated from recurring schedules.
      </p>

      {items.length === 0 && (
        <p className="text-gray-500 text-lg">
          No inspections scheduled for today.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-5 border rounded shadow-sm bg-white"
          >
            <p className="text-xl font-semibold">{item.customers.name}</p>

            <p className="text-gray-600 mt-1">
              Vehicles in fleet:{" "}
              <span className="font-medium">{item.vehicle_count}</span>
            </p>

            <p className="text-gray-500 text-sm mt-1">
              Frequency:{" "}
              <span className="uppercase font-semibold text-blue-600">
                {item.frequency}
              </span>
            </p>

            <button
              onClick={() =>
                router.push(
                  `/fm/requests/new?customer=${item.customer_id}&recurring=${item.id}`
                )
              }
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Start Inspection
            </button>
            <button
                onClick={() => router.push(`/fm/inspections/${item.id}`)}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                View Details
            </button>


          </div>
        ))}
      </div>
    </div>
  );
}
