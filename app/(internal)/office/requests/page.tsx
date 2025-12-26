"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaRequestCard } from "@/components/tesla/TeslaRequestCard";

type Request = {
  id: string;
  status: string;
  type: string;
  urgent?: boolean;
  po?: string | null;
  created_at: string;

  customer_notes?: string | null;
  service?: string | null;

  created_by_role?: string;
  technician_id?: string | null;
  scheduled_start_at?: string | null;

  customer?: {
    id: string;
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

export default function OfficeRequestsPage() {
  const router = useRouter();

  const [rows, setRows] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  // View State
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
      setRows(js.ok ? js.requests ?? [] : []);
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
    if (!groupByCustomer) return { All: filteredRows };

    return filteredRows.reduce<Record<string, Request[]>>((acc, r) => {
      const key = r.customer?.name || "Unknown Customer";
      acc[key] = acc[key] || [];
      acc[key].push(r);
      return acc;
    }, {});
  }, [filteredRows, groupByCustomer]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* 1. PROFESSIONAL HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 font-medium">
            <button 
              onClick={() => router.push("/office")} 
              className="hover:text-black hover:underline transition"
            >
              &larr; Back to Dashboard
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-black">Incoming Requests</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Office Queue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review, prioritize, and prepare requests for dispatch.
          </p>
        </div>

        {/* 2. VIEW CONTROLS (PILL STYLE) */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg self-start md:self-auto">
          <button
            onClick={() => setShowWalkInsOnly((v) => !v)}
            className={clsx(
              "text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-all",
              showWalkInsOnly ? "bg-white shadow text-black" : "text-gray-500 hover:text-black"
            )}
          >
            Walk-Ins Only
          </button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <button
            onClick={() => setGroupByCustomer((v) => !v)}
            className={clsx(
              "text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-all",
              groupByCustomer ? "bg-white shadow text-black" : "text-gray-500 hover:text-black"
            )}
          >
            Group by Customer
          </button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <button
            onClick={() => setExpandedView((v) => !v)}
            className={clsx(
              "text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-all",
              expandedView ? "bg-white shadow text-black" : "text-gray-500 hover:text-black"
            )}
          >
            {expandedView ? "Expanded" : "Compact"}
          </button>
        </div>
      </div>

      {/* 3. REQUEST LIST */}
      <TeslaSection>
        {loading && (
            <div className="p-12 text-center text-gray-400 animate-pulse">
                Loading requests...
            </div>
        )}

        {!loading && filteredRows.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-xl">
            <p className="text-gray-500 font-medium">
              {showWalkInsOnly
                ? "No active walk-in requests found."
                : "No pending requests found."}
            </p>
            <button 
                onClick={() => setShowWalkInsOnly(false)} 
                className="mt-2 text-sm text-green-600 hover:underline"
            >
                View all requests
            </button>
          </div>
        )}

        <div className="space-y-10">
          {Object.entries(grouped).map(([groupName, groupRows]) => (
            <div key={groupName} className="space-y-3">
              {groupByCustomer && (
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wide">
                        {groupName}
                    </h3>
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {groupRows.length}
                    </span>
                </div>
              )}

              {groupRows.map((r) => {
                const v = r.vehicle;
                // Priority: Office Title -> Service Type -> Fallback
                const title = r.service || r.type || "Service Request";

                const vehicleLine = v
                  ? `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim()
                  : null;

                const unitOrPlate = v?.unit_number
                  ? `Unit ${v.unit_number}`
                  : v?.plate
                  ? `Plate ${v.plate}`
                  : null;

                // Subtitle Logic based on View Mode
                const subtitleParts = expandedView 
                    ? [!groupByCustomer ? r.customer?.name : null, vehicleLine, unitOrPlate]
                    : [vehicleLine, unitOrPlate];

                const subtitle = subtitleParts.filter(Boolean).join(" • ");

                const isWalkIn =
                  r.created_by_role === "OFFICE" &&
                  !r.technician_id &&
                  !r.scheduled_start_at;

                return (
                  <TeslaRequestCard
                    key={r.id}
                    title={title}
                    subtitle={subtitle}
                    status={r.status}
                    urgent={r.urgent}
                    po={r.po}
                    createdAt={r.created_at}
                    // In expanded view, show notes right on the card if supported
                    customer={expandedView && !groupByCustomer ? undefined : undefined} 
                    notePreview={expandedView ? r.customer_notes : undefined}
                    isWalkIn={isWalkIn}
                    onClick={() => {
                      router.push(`/office/requests/${r.id}`);
                    }}
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