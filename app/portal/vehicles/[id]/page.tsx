"use client";

import { useEffect, useState } from "react";

type Vehicle = {
  id: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  unit_number?: string | null;
  plate?: string | null;
  vin?: string | null;
  customer?: any;
  location?: any;
  notes?: string | null;
  service_requests?: any[];
};

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function PortalVehicleDetail({ params }: any) {
  const { id } = params;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const data = await fetchJSON<Vehicle>(
          `/api/portal/vehicles/${encodeURIComponent(id)}`
        );
        if (!live) return;
        setVehicle(data);
      } catch (e: any) {
        setErr(e?.message || "Failed to load vehicle");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!vehicle) return <div className="p-6">Not found.</div>;

  // 🔧 FIX #1 (Vehicle location normalization)
  const loc = Array.isArray(vehicle.location)
    ? vehicle.location[0]
    : vehicle.location ?? null;

  // 🔧 FIX #2 (Customer normalization, in case it’s also array)
  const cust = Array.isArray(vehicle.customer)
    ? vehicle.customer[0]
    : vehicle.customer ?? null;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Vehicle #{vehicle.id}</h1>

      {/* Vehicle Overview */}
      <div className="space-y-2">
        <div className="text-lg font-semibold">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </div>
        <div>Unit: {vehicle.unit_number || "—"}</div>
        <div>Plate: {vehicle.plate || "—"}</div>
        <div>VIN: {vehicle.vin || "—"}</div>
      </div>

      {/* Customer */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-1">Customer</h2>
        <p>{cust?.name || "—"}</p>
      </div>

      {/* Location */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-1">Location</h2>
        <p>{loc?.name || "—"}</p>
      </div>

      {/* Notes */}
      {vehicle.notes ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-1">Notes</h2>
          <p className="whitespace-pre-wrap">{vehicle.notes}</p>
        </div>
      ) : null}

      {/* Service Request History */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Service History</h2>

        {!vehicle.service_requests?.length ? (
          <p className="text-gray-500 text-sm">No service history.</p>
        ) : (
          <div className="space-y-4">
            {vehicle.service_requests.map((sr) => {
              const status = sr.status || "—";
              const created = sr.created_at
                ? new Date(sr.created_at).toLocaleString()
                : "—";

              return (
                <div
                  key={sr.id}
                  className="border rounded p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="text-sm font-semibold">
                    Request #{sr.id} — {status}
                  </div>
                  <div className="text-xs text-gray-600">{created}</div>
                  <div className="text-sm mt-1">{sr.service || "—"}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
