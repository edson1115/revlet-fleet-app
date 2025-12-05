"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";
import { TeslaPageTitle } from "@/components/tesla/TeslaPageTitle";

type Vehicle = {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  unit_number: string | null;
  plate: string | null;
  vin: string | null;
};

type ServiceRequest = {
  id: string;
  status: string;
  created_at: string;
  complaint: string | null;
};

export default function VehicleDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/customer/vehicles/${id}`, {
        cache: "no-store",
      });

      const js = await res.json();
      if (!res.ok) throw new Error(js.error || "Failed to load vehicle");

      setVehicle(js.vehicle);
      setRequests(js.requests || []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  if (loading)
    return <div className="text-gray-500 text-sm p-6">Loading…</div>;

  if (err)
    return (
      <div className="text-red-600 text-sm p-6">
        Unable to load vehicle: {err}
      </div>
    );

  if (!vehicle)
    return (
      <div className="text-sm text-gray-500 p-6">Vehicle not found.</div>
    );

  return (
    <div className="space-y-10">

        <a href="/customer" className="text-sm text-blue-600 underline block mb-6">
  ← Back to Portal
</a>


      {/* BACK BUTTON */}
      <Link
        href="/customer/vehicles"
        className="text-sm text-blue-600 underline"
      >
        ← Back to Vehicles
      </Link>

      {/* HEADER */}
      <TeslaPageTitle
        title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        subtitle={`Unit ${vehicle.unit_number} • Plate ${vehicle.plate}`}
      />

      <p className="text-gray-500 text-xs">VIN: {vehicle.vin || "—"}</p>

      <TeslaDivider />

      {/* VEHICLE INFO */}
      <TeslaSection title="Vehicle Information">
        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
          <div>
            <div className="text-gray-500">Make</div>
            <div className="font-medium">{vehicle.make || "—"}</div>
          </div>
          <div>
            <div className="text-gray-500">Model</div>
            <div className="font-medium">{vehicle.model || "—"}</div>
          </div>
          <div>
            <div className="text-gray-500">Year</div>
            <div className="font-medium">{vehicle.year || "—"}</div>
          </div>
          <div>
            <div className="text-gray-500">Unit</div>
            <div className="font-medium">{vehicle.unit_number || "—"}</div>
          </div>
          <div>
            <div className="text-gray-500">Plate</div>
            <div className="font-medium">{vehicle.plate || "—"}</div>
          </div>
          <div>
            <div className="text-gray-500">VIN</div>
            <div className="font-medium">{vehicle.vin || "—"}</div>
          </div>
        </div>
      </TeslaSection>

      <TeslaDivider />

      {/* SERVICE HISTORY */}
      <TeslaSection title="Service History">
        {requests.length === 0 && (
          <div className="text-sm text-gray-600 mt-4">
            No service requests for this vehicle yet.
          </div>
        )}

        <div className="space-y-3 mt-4">
          {requests.map((req) => (
            <Link
              key={req.id}
              href={`/customer/requests/${req.id}`}
              className="block border rounded-xl bg-white p-4 hover:bg-gray-100 transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium">
                    {req.complaint || "Service Request"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(req.created_at).toLocaleDateString()}
                  </div>
                </div>

                <TeslaStatusChip status={req.status} />
              </div>
            </Link>
          ))}
        </div>
      </TeslaSection>
    </div>
  );
}
