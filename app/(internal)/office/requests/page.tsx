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
  po?: string;
  created_at: string;

  customer_notes?: string;
  service?: string;

  created_by_role?: string;
  technician_id?: string | null;
  scheduled_start_at?: string | null;

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
  const [showWalkInsOnly, setShowWalkInsOnly] = useState(false);
  const [expandedView, setExpandedView] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/office/requests", {
        cache: "no-store",
        credentials: "include",
      });
      const js = await res.json();

      if (js.ok) {
        setRows(js.requests ?? []);
      } else {
        setRows([]);
      }
    } catch (err) {
      console.error("Failed to load office requests", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* --------------------------------
     WALK-IN FILTER
  -------------------------------- */
  const filteredRows = useMemo(() => {
    if (!showWalkInsOnly) return rows;

    return rows.filter(
      (r) =>
        r.created_by_role === "OFFICE" &&
        !r.technician_id &&
        !r.scheduled_start_at
    );
  }, [rows, showWalkInsOnly]);

  /* --------------------------------
     GROUPING
  -------------------------------- */
  const grouped = useMemo(() => {
    const base = filteredRows;

    if (!groupByCustomer) return { All: base };

    return base.reduce<Record<string, Request[]>>((acc, r) => {
      const key = r.customer?.name || "Unknown Customer";
      acc[key] = acc[key] || [];
      acc[key].push(r);
      return acc;
    }, {});
  }, [filteredRows, groupByCustomer]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Office Requests</h1>
          <p className="text-sm text-gray-500">
            Review and prepare requests for dispatch
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowWalkInsOnly((v) => !v)}
            className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
          >
            {showWalkInsOnly ? "Show All" : "Walk-Ins Only"}
          </button>

          <button
            onClick={() => setGroupByCustomer((v) => !v)}
            className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
          >
            {groupByCustomer ? "Ungroup" : "Group by Customer"}
          </button>

          <button
            onClick={() => setExpandedView((v) => !v)}
            className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
          >
            {expandedView ? "Compact View" : "Expanded View"}
          </button>
        </div>
      </div>

      <TeslaSection>
        {loading && (
          <div className="p-6 text-gray-500">Loading…</div>
        )}

        {!loading && filteredRows.length === 0 && (
          <div className="p-6 text-gray-500">
            {showWalkInsOnly
              ? "No walk-in requests found."
              : "No requests found."}
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

                const title =
                  r.service || r.type || "Service Request";

                const vehicleLine = v
                  ? `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim()
                  : null;

                const unitOrPlate =
                  v?.unit_number
                    ? `Unit ${v.unit_number}`
                    : v?.plate
                    ? `Plate ${v.plate}`
                    : null;

                const subtitle = expandedView
                  ? [r.customer?.name, vehicleLine, unitOrPlate]
                      .filter(Boolean)
                      .join(" • ")
                  : [vehicleLine, unitOrPlate]
                      .filter(Boolean)
                      .join(" • ");

                const isWalkIn =
                  r.created_by_role === "OFFICE" &&
                  !r.technician_id &&
                  !r.scheduled_start_at;

                return (
                  <div
  key={r.id}
  role="button"
  tabIndex={0}
  className="cursor-pointer focus:outline-none"
  onClick={() => {
    console.log("CLICK FIRED →", r.id);
    router.push(`/office/requests/${r.id}`);
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      console.log("ENTER FIRED →", r.id);
      router.push(`/office/requests/${r.id}`);
    }
  }}
>

                    <TeslaRequestCard
                      title={title}
                      subtitle={subtitle}
                      status={r.status}
                      urgent={r.urgent}
                      po={r.po}
                      createdAt={r.created_at}
                      customer={
                        expandedView ? undefined : r.customer?.name
                      }
                      notePreview={
                        expandedView ? r.customer_notes : undefined
                      }
                      isWalkIn={isWalkIn}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </TeslaSection>
    </div>
  );
}
