"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { TeslaServiceCard } from "@/components/tesla/TeslaServiceCard";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaKV } from "@/components/tesla/TeslaKV";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";


// Optional Timeline loader
let TimelineComp: any = null;
try {
  TimelineComp =
    require("@/components/tesla/TeslaRequestTimeline").TeslaRequestTimeline;
} catch {}

// Types
type UUID = string;

type Row = {
  id: UUID;
  status: string;
  service?: string | null;
  customer?: { name?: string | null } | null;
  location?: { name?: string | null } | null;
  vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    unit_number?: string | null;
  } | null;
  created_at?: string | null;
  scheduled_at?: string | null;
};

// Drawer Detail Type
type RequestDetail = {
  id: UUID;
  status: string;
  service?: string | null;
  fmc?: string | null;
  po?: string | null;
  mileage?: number | null;

  customer?: { name?: string | null } | null;
  location?: { name?: string | null } | null;
  vehicle?: Row["vehicle"];
  technician?: { full_name?: string | null; id?: string } | null;

  notes?: string | null;
  dispatch_notes?: string | null;
  notes_from_tech?: string | null;
  tech_notes?: string | null;
  notes_list?: Array<{ id: string; text: string; created_at: string | null }> | null;

  created_at?: string | null;
  scheduled_at?: string | null;

  // REQUIRED FOR TIMELINE
  preferred_window_start?: string | null;
  preferred_window_end?: string | null;
};

export default function OfficeQueuePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerId, setDrawerId] = useState<UUID | null>(null);
  const [drawerData, setDrawerData] = useState<RequestDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Load List
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/requests?scope=office", { credentials: "include" });
      const js = await res.json();
      if (res.ok) setRows(js.rows || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openDrawer = async (id: UUID) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerId(id);

    try {
      const res = await fetch(`/api/requests/${id}`, { credentials: "include" });
      const js = await res.json();
      if (res.ok) setDrawerData(js.request);
    } catch (e) {
      console.error(e);
    }

    setDrawerLoading(false);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerId(null);
    setDrawerData(null);
  };


  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-semibold tracking-tight">Office Queue</h1>
        <button
          onClick={load}
          className="text-sm px-3 py-1 rounded-lg border bg-[#F8F8F8] hover:bg-white"
        >
          Refresh
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden border border-gray-100">
        <div className="grid grid-cols-6 px-4 py-3 text-xs font-semibold text-gray-500 bg-[#FAFAFA]">
          <div>Status</div>
          <div>Customer</div>
          <div>Vehicle</div>
          <div>Service</div>
          <div>Created</div>
          <div></div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No requests found.</div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              onClick={() => openDrawer(r.id)}
              className="grid grid-cols-6 px-4 py-4 border-t text-sm hover:bg-[#F5F5F5] cursor-pointer"
            >
              <div className="flex items-center">{statusChip(r.status)}</div>
              <div className="flex items-center text-gray-800">{r.customer?.name ?? "—"}</div>
              <div className="flex items-center text-gray-700">
                {r.vehicle
                  ? `${r.vehicle.year ?? ""} ${r.vehicle.make ?? ""} ${r.vehicle.model ?? ""}`
                  : "—"}
              </div>
              <div className="flex items-center text-gray-800">{r.service ?? "—"}</div>
              <div className="flex items-center text-gray-600">
                {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
              </div>
              <div className="flex items-center justify-end text-gray-400">→</div>
            </div>
          ))
        )}
      </div>

      {/* DRAWER */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
          onClick={(e) => e.target === e.currentTarget && closeDrawer()}
        >
          <div className="w-full max-w-xl h-full bg-[#F7F7F7] shadow-2xl rounded-l-2xl overflow-y-auto">

            {/* Drawer Header */}
            <div className="sticky top-0 bg-[#F7F7F7] border-b px-6 py-4 flex justify-between">
              <h2 className="text-lg font-semibold">Request Details</h2>
              <button className="px-3 py-1 rounded-full" onClick={closeDrawer}>✕</button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6">
              {drawerLoading || !drawerData ? (
                <div className="text-gray-500 text-center py-10">Loading…</div>
              ) : (
                <>
                  {/* SUMMARY */}
                  <TeslaServiceCard title="Summary" badge={drawerData.status}>
                    <TeslaSection label="Customer">
                      <TeslaKV k="Name" v={drawerData.customer?.name ?? "—"} />
                    </TeslaSection>

                    <TeslaSection label="Location">
                      <TeslaKV k="Shop" v={drawerData.location?.name ?? "—"} />
                    </TeslaSection>

                    <TeslaSection label="Vehicle">
                      <TeslaKV
                        k="Unit"
                        v={
                          drawerData.vehicle
                            ? `${drawerData.vehicle.year ?? ""} ${drawerData.vehicle.make ?? ""} ${
                                drawerData.vehicle.model ?? ""
                              }`
                            : "—"
                        }
                      />
                    </TeslaSection>

                    <TeslaSection label="Service">
                      <TeslaKV k="Requested" v={drawerData.service ?? "—"} />
                    </TeslaSection>

                    <TeslaSection label="Technician">
                      <TeslaKV
                        k="Assigned"
                        v={drawerData.technician?.full_name ?? "—"}
                      />
                    </TeslaSection>
                  </TeslaServiceCard>

                  {/* TIMELINE */}
                  <TeslaServiceCard title="Timeline">
                    {TimelineComp ? (
                      <TimelineComp
                        scheduled={drawerData.scheduled_at}
                        preferredStart={drawerData.preferred_window_start}
                        preferredEnd={drawerData.preferred_window_end}
                      />
                    ) : (
                      <TeslaSection label="Events">
                        <div className="space-y-2 text-sm text-gray-700">
                          <div>
                            <span className="opacity-60">Created:</span>{" "}
                            {drawerData.created_at
                              ? new Date(drawerData.created_at).toLocaleString()
                              : "—"}
                          </div>

                          <div>
                            <span className="opacity-60">Scheduled:</span>{" "}
                            {drawerData.scheduled_at
                              ? new Date(drawerData.scheduled_at).toLocaleString()
                              : "—"}
                          </div>

                          <div>
                            <span className="opacity-60">Preferred Window:</span>{" "}
                            {drawerData.preferred_window_start
                              ? new Date(drawerData.preferred_window_start).toLocaleString()
                              : "—"}{" "}
                            →
                            {drawerData.preferred_window_end
                              ? new Date(drawerData.preferred_window_end).toLocaleString()
                              : "—"}
                          </div>
                        </div>
                      </TeslaSection>
                    )}
                  </TeslaServiceCard>

                  {/* NOTES */}
                  <TeslaServiceCard title="Notes">
                    <TeslaSection label="Office Notes">
                      <div className="text-sm whitespace-pre-wrap">
                        {drawerData.notes ?? "—"}
                      </div>
                    </TeslaSection>
                  </TeslaServiceCard>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
