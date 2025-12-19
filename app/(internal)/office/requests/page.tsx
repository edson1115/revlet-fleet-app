"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaRequestCard } from "@/components/tesla/TeslaRequestCard";

type Request = {
  id: string;
  status: string;
  type: string;
  urgent?: boolean;

  /** CUSTOMER PROVIDED */
  customer_notes?: string;

  /** OFFICE FINAL SERVICE NAME */
  service?: string;

  po?: string;
  created_at: string;

  customer?: {
    id: string;
    name?: string;
  };

  vehicle?: {
    year?: number;
    make?: string;
    model?: string;
    plate?: string;
    unit_number?: string;
  };
};

export default function OfficeRequestsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupByCustomer, setGroupByCustomer] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/office/requests", {
      cache: "no-store",
      credentials: "include",
    });
    const js = await res.json();
    if (js.ok) setRows(js.rows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  /* -------------------------------
     GROUPING (CLIENT-SIDE ONLY)
  -------------------------------- */
  const grouped = useMemo(() => {
    if (!groupByCustomer) return { All: rows };

    return rows.reduce<Record<string, Request[]>>((acc, r) => {
      const key = r.customer?.name || "Unknown Customer";
      acc[key] = acc[key] || [];
      acc[key].push(r);
      return acc;
    }, {});
  }, [rows, groupByCustomer]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Office Requests</h1>
          <p className="text-sm text-gray-500">
            Review and prepare requests for dispatch
          </p>
        </div>

        <button
          onClick={() => setGroupByCustomer((v) => !v)}
          className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
        >
          {groupByCustomer ? "Ungroup" : "Group by Customer"}
        </button>
      </div>

      <TeslaSection>
        {loading && (
          <div className="p-6 text-gray-500">Loading…</div>
        )}

        {!loading && rows.length === 0 && (
          <div className="p-6 text-gray-500">
            No requests found.
          </div>
        )}

        <div className="space-y-8">
          {Object.entries(grouped).map(([groupName, groupRows]) => (
            <div key={groupName} className="space-y-4">
              {groupByCustomer && (
                <div className="text-sm font-semibold text-gray-700">
                  {groupName}
                </div>
              )}

              {groupRows.map((r) => {
                const v = r.vehicle;

                /* OFFICE SERVICE NAME WINS */
                const title =
                  r.service ||
                  r.type ||
                  "Service Request";

                const vehicleLine = v
                  ? `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim()
                  : null;

                const unitOrPlate =
                  v?.unit_number
                    ? `Unit ${v.unit_number}`
                    : v?.plate
                    ? `Plate ${v.plate}`
                    : null;

                const subtitle = [
                  vehicleLine,
                  unitOrPlate,
                ]
                  .filter(Boolean)
                  .join(" • ");

                return (
                  <TeslaRequestCard
                    key={r.id}
                    title={title}
                    subtitle={subtitle}
                    status={r.status}
                    urgent={r.urgent}
                    po={r.po}
                    createdAt={r.created_at}
                    customer={r.customer?.name}
                    notePreview={r.customer_notes}
                    onClick={() =>
                      router.push(`/office/requests/${r.id}`)
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </TeslaSection>
    </div>
  );
}
