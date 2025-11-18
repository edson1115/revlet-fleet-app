// app/vehicle/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Vehicle = {
  id: string;
  unit_number?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  plate?: string | null;
  vin?: string | null;          // <-- ADD THIS
  customer_id?: string | null;  // <-- KEEP THIS
};



export default function VehiclePage({ params }: any) {
  const vehicleId = params.id;
  const router = useRouter();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/portal/vehicle/${vehicleId}`);
      const data = await res.json();

      setVehicle(data.vehicle);
      setRequests(data.requests || []);
      setPhotos(data.photos || []);
    }
    load();
  }, [vehicleId]);

  if (!vehicle) {
    return <div className="p-6">Loading vehicle…</div>;
  }

  return (
    <div className="p-6 space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-gray-600 mt-1">
            Unit: {vehicle.unit_number || "—"}  
          </p>
          <p className="text-gray-600">
            Plate: {vehicle.plate || "—"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            VIN: {vehicle.vin || "—"}
          </p>
        </div>

        <button
          onClick={() =>
            router.push(`/fm/requests/new?vehicle=${vehicle.id}&customer=${vehicle.customer_id}`)
          }
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Create Service Request
        </button>
      </div>

      {/* AI ANALYSIS (Future Upgrade) */}
      <AIAnalysis />

      {/* PHOTO GALLERY */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Photos</h2>

        {!photos.length && <p className="text-gray-500">No photos uploaded.</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((p) => (
            <div key={p.id} className="border rounded shadow-sm overflow-hidden">
              <img
                src={p.url}
                alt="vehicle"
                className="w-full h-40 object-cover"
              />
              <p className="p-2 text-xs text-gray-500 uppercase">{p.type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SERVICE HISTORY */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Service History</h2>

        {requests.length === 0 && (
          <p className="text-gray-500">No service requests found.</p>
        )}

        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="p-4 border rounded shadow-sm">
              <p className="font-semibold">
                {r.service_type || "Service"} — #{r.id.slice(0, 6)}
              </p>
              <p className="text-gray-600 text-sm">{r.description}</p>

              <p className="text-xs mt-1 text-gray-500">
                Status: {r.status}
              </p>

              <p className="text-xs mt-1 text-gray-400">
                Created: {new Date(r.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------
   AI ANALYSIS PLACEHOLDER (Future AI)
-------------------------------------- */
function AIAnalysis() {
  return (
    <div className="p-4 border rounded shadow bg-gray-50">
      <h3 className="text-lg font-semibold">AI Analysis</h3>
      <p className="text-sm text-gray-500">
        Vision AI analysis coming soon — detect damage, wear, leaks, tire issues,
        brake wear, and more.
      </p>
    </div>
  );
}
