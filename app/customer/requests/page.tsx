"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { TeslaPageTitle } from "@/components/tesla/TeslaPageTitle";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

type RequestItem = {
  id: string;
  status: string;
  created_at: string;
  complaint: string | null;
  vehicle: {
    id: string;
    make: string | null;
    model: string | null;
    year: number | null;
    unit_number: string | null;
    plate: string | null;
  } | null;
};

export default function CustomerRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/customer/requests", {
        cache: "no-store",
      });

      const js = await res.json();
      if (!res.ok) throw new Error(js.error || "Failed to load requests");

      setRequests(js.requests || []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="text-gray-500 text-sm p-6">Loading…</div>;
  }

  if (err) {
    return (
      <div className="text-sm text-red-600 p-6">
        Could not load requests: {err}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <TeslaPageTitle
          title="Service Requests"
          subtitle="View and track your recent service activity"
        />

        <Link
          href="/customer/requests/new"
          className="text-sm px-4 py-2 rounded-md border bg-white hover:bg-gray-50"
        >
          + New Request
        </Link>
      </div>

      <TeslaDivider />

      {/* REQUESTS LIST */}
      <TeslaSection title="Recent Requests">
        {requests.length === 0 && (
          <div className="text-sm text-gray-600 mt-4">
            No service requests yet.
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
                {/* LEFT SIDE (complaint + date + vehicle) */}
                <div>
                  <div className="text-sm font-medium">
                    {req.complaint || "Service Request"}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(req.created_at).toLocaleDateString()}
                  </div>

                  {req.vehicle && (
                    <div className="text-xs text-gray-600 mt-1">
                      {req.vehicle.year} {req.vehicle.make}{" "}
                      {req.vehicle.model} — Unit {req.vehicle.unit_number} —{" "}
                      {req.vehicle.plate}
                    </div>
                  )}
                </div>

                {/* RIGHT SIDE (status chip) */}
                <TeslaStatusChip status={req.status} />
              </div>
            </Link>
          ))}
        </div>
      </TeslaSection>
    </div>
  );
}
