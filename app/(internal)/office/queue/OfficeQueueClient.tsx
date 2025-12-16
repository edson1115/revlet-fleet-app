"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

type OfficeRequest = {
  id: string;
  short_id?: string;
  service?: string;
  status: string;
  created_at: string;
  market?: string;
  customer?: {
    name?: string;
  };
  vehicle?: {
    year?: number;
    make?: string;
    model?: string;
    plate?: string;
  };
};

export default function OfficeQueueClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OfficeRequest[]>([]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/office/queue", {
        cache: "no-store",
        credentials: "include",
      });

      const js = await res.json();
      if (js.ok) {
        setRows(js.rows || []);
      } else {
        console.error("Queue load failed:", js.error);
      }
    } catch (e) {
      console.error("Office queue error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading queue…</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No requests waiting for office review.
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-2xl divide-y">
      {rows.map((req) => (
        <div
          key={req.id}
          onClick={() => router.push(`/office/requests/${req.id}`)}
          className="p-4 hover:bg-gray-50 cursor-pointer transition"
        >
          <div className="flex items-start justify-between gap-4">
            {/* LEFT */}
            <div className="space-y-1">
              <div className="font-medium text-gray-900 flex items-center gap-2">
                {req.service || "Service Request"}
                <TeslaStatusChip status={req.status} />
              </div>

              {req.vehicle && (
                <div className="text-sm text-gray-600">
                  {req.vehicle.year} {req.vehicle.make} {req.vehicle.model}
                  {req.vehicle.plate && ` • ${req.vehicle.plate}`}
                </div>
              )}

              {req.customer?.name && (
                <div className="text-xs text-gray-500">
                  Customer: {req.customer.name}
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div className="text-right text-xs text-gray-400 whitespace-nowrap">
              {new Date(req.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
