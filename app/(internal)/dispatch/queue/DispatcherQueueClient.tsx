"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import TeslaCard from "@/components/tesla/TeslaCard";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

type QueueRequest = {
  id: string;
  status: string;
  urgent: boolean;
  created_at: string;

  service_title?: string | null;
  service_description?: string | null;
  service?: string | null;
  type?: string | null;

  customer?: {
    name?: string | null;
  } | null;

  vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    plate?: string | null;
    unit_number?: string | null;
  } | null;
};

function resolveServiceTitle(r: QueueRequest) {
  if (r.type === "TIRE_PURCHASE") return "Tire Purchase";
  return r.service_title || r.service || r.type || "Service Request";
}

export default function DispatcherQueueClient() {
  const router = useRouter();
  const [rows, setRows] = useState<QueueRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadQueue() {
    setLoading(true);

    const res = await fetch(
      "/api/dispatch/queue?status=READY_TO_SCHEDULE",
      { cache: "no-store", credentials: "include" }
    );

    const js = await res.json();
    if (js.ok && Array.isArray(js.rows)) setRows(js.rows);

    setLoading(false);
  }

  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dispatcher Queue</h1>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {!loading && rows.length === 0 && (
        <div className="text-sm text-gray-500">
          No requests ready to schedule.
        </div>
      )}

      <div className="space-y-4">
        {rows.map((r) => {
          const v = r.vehicle;

          return (
            <TeslaCard
              key={r.id}
              onClick={() =>
                router.push(`/dispatch/requests/${r.id}`)
              }
              className="cursor-pointer hover:shadow-md transition"
            >
              <div className="flex justify-between gap-4">
                {/* LEFT */}
                <div className="space-y-1">
                  <div className="font-semibold">
                    {resolveServiceTitle(r)}
                  </div>

                  {r.service_description && (
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {r.service_description}
                    </div>
                  )}

                  <div className="text-sm text-gray-500">
                    {r.customer?.name ?? "Unknown customer"}
                  </div>

                  {v && (
                    <div className="text-xs text-gray-400">
                      {v.year} {v.make} {v.model}
                      {v.unit_number
                        ? ` · Unit ${v.unit_number}`
                        : v.plate
                        ? ` · ${v.plate}`
                        : ""}
                    </div>
                  )}
                </div>

                {/* RIGHT */}
                <div className="flex flex-col items-end gap-2">
                  <TeslaStatusChip status={r.status} />

                  {r.urgent && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-50 border border-red-200 text-red-700">
                      URGENT
                    </span>
                  )}
                </div>
              </div>
            </TeslaCard>
          );
        })}
      </div>
    </div>
  );
}
