"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaTabs } from "@/components/tesla/TeslaTabs";
import { TeslaRequestCard } from "@/components/tesla/TeslaRequestCard";

type Request = {
  id: string;
  status: string;
  type: string;
  urgent?: boolean;
  service?: string;
  po?: string;
  created_at: string;

  vehicle?: {
    year?: number;
    make?: string;
    model?: string;
    plate?: string;
    unit_number?: string;
  };
};

const TABS = [
  { label: "Ready to Schedule", value: "READY_TO_SCHEDULE" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "In Progress", value: "IN_PROGRESS" },
];

export default function DispatcherRequestsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("READY_TO_SCHEDULE");
  const [rows, setRows] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(
      `/api/dispatch/requests?status=${status}`,
      { cache: "no-store", credentials: "include" }
    );
    const js = await res.json();
    if (js.ok) setRows(js.rows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dispatcher Queue</h1>
        <p className="text-sm text-gray-500">
          Requests ready for technician assignment
        </p>
      </div>

      <TeslaTabs value={status} onChange={setStatus} tabs={TABS} />

      <TeslaSection>
        {loading && (
          <div className="p-6 text-gray-500">Loading…</div>
        )}

        {!loading && rows.length === 0 && (
          <div className="p-6 text-gray-500">
            No requests in this queue.
          </div>
        )}

        <div className="space-y-4">
          {rows.map((r) => {
            const v = r.vehicle;
            const title = v
              ? `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}${
                  v.unit_number ? ` (Unit ${v.unit_number})` : ""
                }`.trim()
              : "Service Request";

            return (
              <TeslaRequestCard
                key={r.id}
                title={title}
                subtitle={r.service || r.type}
                status={r.status}
                urgent={r.urgent}
                po={r.po}
                createdAt={r.created_at}
                onClick={() =>
                  router.push(`/dispatch/requests/${r.id}`)
                }
              />
            );
          })}
        </div>
      </TeslaSection>
    </div>
  );
}
