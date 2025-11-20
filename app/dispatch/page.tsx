"use client";

//
// FINAL — TESLA DISPATCH PAGE
// Includes:
// - PURE Tesla lanes (4 lanes)
// - Full Tesla Drawer
// - Thumbnails
// - Realtime updates
// - Tech assignment
// - Parts card (save)
// - Labor card (live refresh)
// - Timeline
//

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";

import { supabaseBrowser } from "@/lib/supabase/browser";
import { normalizeRole, roleToPermissions } from "@/lib/permissions";
import { useLocationScope } from "@/lib/useLocationScope";

import ImageCountPill from "@/components/images/ImageCountPill";
import Lightbox from "@/components/common/Lightbox";

// TESLA MODULES
import TeslaTimeline from "@/components/tesla/TeslaTimeline";
import TeslaTechAssignCard from "@/components/tesla/TeslaTechAssignCard";
import TeslaPartsCard from "@/components/tesla/TeslaPartsCard";
import TeslaLaborCard from "@/components/tesla/TeslaLaborCard";
import TeslaActionsRow from "@/components/tesla/TeslaActionsRow";

///////////////////////////////////////////////////////////////
// TYPES
///////////////////////////////////////////////////////////////

type UUID = string;

type Technician = {
  id: UUID;
  name?: string | null;
  full_name?: string | null;
  active?: boolean | null;
};

type Customer = { id: UUID; name?: string | null } | null;
type Location = { id: UUID; name?: string | null } | null;

type Vehicle = {
  id: UUID;
  unit_number?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  plate?: string | null;
} | null;

type RequestRow = {
  id: UUID;
  status: string;
  service?: string | null;
  fmc?: string | null;
  po?: string | null;

  notes?: string | null;
  dispatch_notes?: string | null;
  notes_from_tech?: string | null;
  tech_notes?: string | null;

  created_at?: string;
  scheduled_at?: string | null;
  tech_started_at?: string | null;
  tech_finished_at?: string | null;

  customer?: Customer;
  vehicle?: Vehicle;
  location?: Location;
  technician?: Technician | null;

  priority?: string | null;
  mileage?: number | null;

  parts?: any[];
  checklist?: any[];
};

type Thumb = {
  id: string;
  kind: "before" | "after" | "other" | string;
  url_thumb: string;
  url_work: string;
  taken_at?: string;
};

///////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

async function postJSON<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const js = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(js.error || res.statusText);
  return js as T;
}

function normStatus(s?: string | null) {
  return String(s || "").toUpperCase().replace(/_/g, " ");
}

function fmt(dt?: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleString();
}

function countKinds(arr: Thumb[] = []) {
  let before = 0;
  let after = 0;
  let other = 0;
  for (const t of arr) {
    if (t.kind === "before") before++;
    else if (t.kind === "after") after++;
    else other++;
  }
  return { total: arr.length, before, after, other };
}

function calcActualMinutes(r: RequestRow) {
  if (!r.tech_started_at) return 0;
  const start = new Date(r.tech_started_at).getTime();
  const end = r.tech_finished_at
    ? new Date(r.tech_finished_at).getTime()
    : Date.now();
  if (isNaN(start) || isNaN(end)) return 0;
  return Math.floor((end - start) / 60000);
}

function useSupabaseClient() {
  const ref = useRef<any>(null);
  if (typeof window !== "undefined" && !ref.current) {
    const { createClient } = require("@supabase/supabase-js");
    ref.current = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { realtime: { params: { eventsPerSecond: 5 } } }
    );
  }
  return ref.current;
}

///////////////////////////////////////////////////////////////
// LANE CARD (Tesla style)
///////////////////////////////////////////////////////////////

function TeslaLaneCard({
  r,
  thumbs,
  tone,
  onClick,
}: {
  r: RequestRow;
  thumbs: Thumb[];
  tone: "white" | "amber" | "blue";
  onClick: () => void;
}) {
  const stats = countKinds(thumbs);

  const toneClass =
    tone === "amber"
      ? "bg-amber-50 border border-amber-200"
      : tone === "blue"
      ? "bg-[#F4FAFF] border border-[#CDE7FF]"
      : "bg-white border border-gray-200";

  const badgeClass =
    tone === "amber"
      ? "bg-amber-600"
      : tone === "blue"
      ? "bg-sky-800"
      : "bg-black";

  return (
    <li
      onClick={onClick}
      className={`rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col gap-4 ${toneClass}`}
    >
      {/* Top Row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="text-xs text-gray-700 font-medium">
            {fmt(r.scheduled_at || r.created_at)}
          </div>
          {r.technician && (
            <div className="text-[11px] text-gray-500">
              Tech: {r.technician.full_name || r.technician.name}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ImageCountPill
            total={stats.total}
            before={stats.before}
            after={stats.after}
            other={stats.other}
          />
          <span
            className={`px-2 py-0.5 text-[10px] rounded-full text-white ${badgeClass}`}
          >
            {normStatus(r.status)}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1 text-sm text-gray-800">
        <div>
          <span className="text-gray-500">Service:</span> {r.service || "—"}
        </div>
        <div>
          <span className="text-gray-500">Customer:</span>{" "}
          {r.customer?.name || "—"}
        </div>
        <div>
          <span className="text-gray-500">Location:</span>{" "}
          {r.location?.name || "—"}
        </div>
        <div>
          <span className="text-gray-500">Vehicle:</span>{" "}
          {r.vehicle
            ? [
                r.vehicle.unit_number && `#${r.vehicle.unit_number}`,
                r.vehicle.year,
                r.vehicle.make,
                r.vehicle.model,
                r.vehicle.plate && `(${r.vehicle.plate})`,
              ]
                .filter(Boolean)
                .join(" ")
            : "—"}
        </div>
      </div>

      {/* Thumbs */}
      {thumbs.length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {thumbs.slice(0, 6).map((t) => (
            <img
              key={t.id}
              src={t.url_thumb}
              className="h-14 w-14 rounded-lg object-cover shadow"
            />
          ))}
        </div>
      )}
    </li>
  );
}

///////////////////////////////////////////////////////////////
// MAIN PAGE
///////////////////////////////////////////////////////////////

export default function DispatchPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  const { locationId } = useLocationScope();
  const supabase = useSupabaseClient();

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<any>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerSaving, setDrawerSaving] = useState(false);

  // Thumbs
  const [thumbsByReq, setThumbsByReq] = useState<Record<string, Thumb[]>>({});
  const [lbOpen, setLbOpen] = useState(false);
  const [lbImages, setLbImages] = useState<any[]>([]);
  const [lbIndex, setLbIndex] = useState(0);

  ///////////////////////////////////////////////////////////////
  // OPEN DRAWER
  ///////////////////////////////////////////////////////////////
  async function openDrawer(id: string) {
    setDrawerOpen(true);
    setDrawerLoading(true);

    try {
      const js = await getJSON<{ request: any }>(`/api/requests/${id}`);
      setDrawerData(js.request);
    } catch (err) {
      console.error(err);
      setDrawerData(null);
    }

    setDrawerLoading(false);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setDrawerData(null);
  }

  ///////////////////////////////////////////////////////////////
  // LOAD TECHS
  ///////////////////////////////////////////////////////////////
  useEffect(() => {
    (async () => {
      try {
        const out = await getJSON<any>("/api/techs?active=1");
        const list = Array.isArray(out) ? out : out.rows;
        setTechs(list.filter((t: any) => (t.active ?? true)));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  ///////////////////////////////////////////////////////////////
  // LOAD REQUESTS
  ///////////////////////////////////////////////////////////////
  const load = useCallback(async () => {
    try {
      setLoading(true);

      const qs = new URLSearchParams();
      qs.set(
        "status",
        "WAITING_TO_BE_SCHEDULED,SCHEDULED,RESCHEDULE,IN_PROGRESS"
      );
      qs.set("sortBy", "scheduled_at");
      qs.set("sortDir", "asc");
      if (locationId) qs.set("location_id", locationId);

      const out = await getJSON<{ rows: RequestRow[] }>(
        `/api/requests?${qs.toString()}`
      );

      const data = out.rows || [];

      // sort nulls bottom
      data.sort((a, b) => {
        const A = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
        const B = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
        return A - B;
      });

      setRows(data);

      // Thumbs
      const ids = data.map((r) => r.id);
      if (ids.length) {
        const param = encodeURIComponent(ids.join(","));
        const thumbs = await getJSON<{
          byRequest: Record<string, Thumb[]>;
        }>(`/api/images/list?request_ids=${param}`);
        setThumbsByReq(thumbs.byRequest);
      } else {
        setThumbsByReq({});
      }
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    load();
  }, [load]);

  ///////////////////////////////////////////////////////////////
  // REALTIME SUBSCRIPTION
  ///////////////////////////////////////////////////////////////
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase
      .channel("dispatch")
      .on(
        "postgres_changes",
        { schema: "public", table: "service_requests", event: "*" },
        () => load()
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [supabase, load]);

  ///////////////////////////////////////////////////////////////
  // LIVE LABOR REFRESH
  ///////////////////////////////////////////////////////////////
  useEffect(() => {
    const id = setInterval(() => setRows((x) => [...x]), 30000);
    return () => clearInterval(id);
  }, []);

  ///////////////////////////////////////////////////////////////
  // GROUPED L ANES
  ///////////////////////////////////////////////////////////////
  const grouped = useMemo(() => {
    const waiting = rows.filter(
      (r) =>
        normStatus(r.status) === "WAITING TO BE SCHEDULED" &&
        !(r.dispatch_notes || "").toLowerCase().startsWith("tech send-back:")
    );

    const needs = rows.filter((r) => {
      const s = normStatus(r.status);
      const sendBack = (r.dispatch_notes || "")
        .toLowerCase()
        .startsWith("tech send-back:");
      return s === "RESCHEDULE" || sendBack;
    });

    const scheduled = rows.filter(
      (r) => normStatus(r.status) === "SCHEDULED"
    );

    const progress = rows.filter(
      (r) => normStatus(r.status) === "IN PROGRESS"
    );

    return {
      waiting,
      needsReschedule: needs,
      scheduled,
      inProgress: progress,
    };
  }, [rows]);

  ///////////////////////////////////////////////////////////////
  // SAVE PARTS
  ///////////////////////////////////////////////////////////////
  async function saveParts(requestId: string, parts: any[]) {
    return await postJSON("/api/requests/batch", {
      op: "parts",
      ids: [requestId],
      parts,
    });
  }

  ///////////////////////////////////////////////////////////////
  // RENDER PAGE
  ///////////////////////////////////////////////////////////////

  return (
    <>
      <div className="max-w-7xl mx-auto p-6 space-y-12">
        {/* WAITING */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Waiting to be Scheduled</h2>
          <ul className="space-y-4">
            {grouped.waiting.map((r) => (
              <TeslaLaneCard
                key={r.id}
                r={r}
                tone="white"
                thumbs={thumbsByReq[r.id] || []}
                onClick={() => openDrawer(r.id)}
              />
            ))}
          </ul>
        </section>

        {/* NEEDS RESCHEDULE */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Needs Reschedule</h2>
          <ul className="space-y-4">
            {grouped.needsReschedule.map((r) => (
              <TeslaLaneCard
                key={r.id}
                r={r}
                tone="amber"
                thumbs={thumbsByReq[r.id] || []}
                onClick={() => openDrawer(r.id)}
              />
            ))}
          </ul>
        </section>

        {/* SCHEDULED */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Scheduled</h2>
          <ul className="space-y-4">
            {grouped.scheduled.map((r) => (
              <TeslaLaneCard
                key={r.id}
                r={r}
                tone="blue"
                thumbs={thumbsByReq[r.id] || []}
                onClick={() => openDrawer(r.id)}
              />
            ))}
          </ul>
        </section>

        {/* IN PROGRESS */}
        <section>
          <h2 className="text-xl font-semibold mb-3">In Progress</h2>
          <ul className="space-y-4">
            {grouped.inProgress.map((r) => (
              <TeslaLaneCard
                key={r.id}
                r={r}
                tone="white"
                thumbs={thumbsByReq[r.id] || []}
                onClick={() => openDrawer(r.id)}
              />
            ))}
          </ul>
        </section>
      </div>

      {/* LIGHTBOX */}
      <Lightbox
        open={lbOpen}
        images={lbImages}
        index={lbIndex}
        onClose={() => setLbOpen(false)}
        onIndex={(i) => setLbIndex(i)}
      />

      {/* TESLA DRAWER */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDrawer();
          }}
        >
          <div className="w-full max-w-xl h-full bg-[#F7F7F7] rounded-l-2xl overflow-y-auto shadow-2xl">
            {/* HEADER */}
            <div className="sticky top-0 bg-[#F7F7F7] border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold tracking-tight">
                Request Details
              </h2>
              <button
                className="px-3 py-1 rounded-full hover:bg-gray-200"
                onClick={closeDrawer}
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-6">
              {drawerLoading ? (
                <div className="text-center text-gray-500 py-10">Loading…</div>
              ) : !drawerData ? (
                <div className="text-center text-gray-500 py-10">Not found.</div>
              ) : (
                <>
                  <TeslaTimeline
                    created={drawerData.created_at}
                    scheduled={drawerData.scheduled_at}
                    preferredStart={drawerData.preferred_window_start}
                    preferredEnd={drawerData.preferred_window_end}
                    status={drawerData.status}
                  />

                  <TeslaTechAssignCard
                    request={drawerData}
                    techs={techs}
                    onUpdate={(next) =>
                      setDrawerData((prev: any) => ({ ...prev, ...next }))
                    }
                  />

                  <TeslaLaborCard
                    estHours={drawerData.est_hours || 1.5}
                    actualMinutes={calcActualMinutes(drawerData)}
                  />

                  <TeslaPartsCard
                    requestId={drawerData.id}
                    initialParts={drawerData.parts || []}
                    initialChecklist={drawerData.checklist || []}
                    onSave={(next) =>
                      setDrawerData((prev: any) => ({ ...prev, ...next }))
                    }
                  />

                  <button
                    disabled={drawerSaving}
                    onClick={async () => {
                      try {
                        setDrawerSaving(true);
                        await saveParts(
                          drawerData.id,
                          drawerData.parts || []
                        );
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setDrawerSaving(false);
                      }
                    }}
                    className="w-full bg-black text-white py-2 rounded-lg text-sm disabled:opacity-50"
                  >
                    {drawerSaving ? "Saving…" : "Save Parts"}
                  </button>

                  <TeslaActionsRow
                    requestId={drawerData.id}
                    currentStatus={drawerData.status}
                    onAction={() => {}}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

