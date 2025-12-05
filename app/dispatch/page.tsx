"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabaseBrowser } from "@/lib/supabase/browser";
import { useLocationScope } from "@/lib/useLocationScope";

import ImageCountPill from "@/components/images/ImageCountPill";
import TeslaTechAssignCard from "@/components/tesla/TeslaTechAssignCard";

/* -----------------------------------------------------------
   TYPES
----------------------------------------------------------- */

type UUID = string;

type Technician = {
  id: UUID;
  full_name?: string | null;
  active?: boolean | null;
};

type Thumb = {
  id: string;
  kind: string;
  url_thumb: string;
  url_work: string;
};

type RequestRow = {
  id: UUID;
  status: string;

  service?: string | null;
  notes?: string | null;
  dispatch_notes?: string | null;

  created_at?: string;

  scheduled_end_at?: string | null;     // FIXED

  customer?: any;
  location?: any;
  vehicle?: any;

  technician?: {
    id: string;
    full_name?: string | null;
  } | null;
};

/* -----------------------------------------------------------
   HELPERS
----------------------------------------------------------- */

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function normStatus(s: string) {
  return String(s || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");
}

function countKinds(thumbs: Thumb[]) {
  let before = 0,
    after = 0,
    other = 0;

  thumbs.forEach((t) => {
    if (t.kind === "BEFORE") before++;
    else if (t.kind === "AFTER") after++;
    else other++;
  });

  return { total: thumbs.length, before, after, other };
}

/* -----------------------------------------------------------
   DRAG-ZONE
----------------------------------------------------------- */

function TechLaneDropZone({
  tech,
  onDropRequest,
  children,
}: {
  tech: Technician;
  onDropRequest: (requestId: string, techId: string) => void;
  children: any;
}) {
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const requestId = e.dataTransfer.getData("request-id");
    if (requestId) onDropRequest(requestId, tech.id);
  }

  return (
    <div
      className="min-h-[200px] pb-10"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
}

/* -----------------------------------------------------------
   PAGE
----------------------------------------------------------- */

export default function DispatchPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [thumbsByReq, setThumbsByReq] =
    useState<Record<string, Thumb[]>>({});

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<any>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const { locationId } = useLocationScope();
  const supabase = supabaseBrowser();

  /* LOAD TECHS ------------------------------------------------ */

  useEffect(() => {
    (async () => {
      try {
        const out = await getJSON<any>("/api/techs?active=1");
        setTechs(out.rows || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  /* DRAWER ---------------------------------------------------- */

  async function openDrawer(id: string) {
    setDrawerOpen(true);
    setDrawerLoading(true);

    try {
      const js = await getJSON<any>(`/api/requests/${id}`);
      setDrawerData(js.request || js);
    } catch {
      setDrawerData(null);
    }

    setDrawerLoading(false);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setDrawerData(null);
  }

  /* LOAD REQUESTS — FIXED SCHEMA ----------------------------- */

  const load = useCallback(async () => {
    const qs = new URLSearchParams();

    qs.set(
      "status",
      "WAITING_TO_BE_SCHEDULED,SCHEDULED,RESCHEDULE,IN_PROGRESS"
    );

    qs.set("sortBy", "scheduled_start_at");
    qs.set("sortDir", "asc");

    if (locationId) qs.set("location_id", locationId);

    const out = await getJSON<any>(`/api/requests?${qs.toString()}`);
    const data = out.rows || [];

// use new scheduled_start_at
data.sort((a: any, b: any) => {
  const A = a.scheduled_start_at
    ? new Date(a.scheduled_start_at).getTime()
    : Infinity;

  const B = b.scheduled_start_at
    ? new Date(b.scheduled_start_at).getTime()
    : Infinity;

  return A - B;
});


    // Fix local sorting
    data.sort((a: any, b: any) => {
      const A = a.scheduled_start_at
  ? new Date(a.scheduled_start_at).getTime()
  : Infinity;

const B = b.scheduled_start_at
  ? new Date(b.scheduled_start_at).getTime()
  : Infinity;

return A - B;

    });

    setRows(data);

    // Load thumbnails
    const ids = data.map((r: any) => r.id);
    if (ids.length) {
      const thumbs = await getJSON<any>(
        `/api/images/list?request_ids=${encodeURIComponent(
          ids.join(",")
        )}`
      );
      setThumbsByReq(thumbs.byRequest || {});
    }
  }, [locationId]);

  useEffect(() => {
    load();
  }, [load]);

  /* REALTIME -------------------------------------------------- */

  useEffect(() => {
    if (!supabase) return;

    const ch1 = supabase
      .channel("dispatch-requests")
      .on(
        "postgres_changes",
        { schema: "public", table: "service_requests", event: "*" },
        load
      )
      .subscribe();

    const ch2 = supabase
      .channel("dispatch-schedule-blocks")
      .on(
        "postgres_changes",
        { schema: "public", table: "schedule_blocks", event: "*" },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [supabase, load]);

  /* GROUP ----------------------------------------------------- */

  const grouped = useMemo(() => {
    const waiting = rows.filter(
      (r) => normStatus(r.status) === "WAITING TO BE SCHEDULED"
    );

    const needs = rows.filter((r) => normStatus(r.status) === "RESCHEDULE");

    const scheduled = rows.filter(
      (r) => normStatus(r.status) === "SCHEDULED"
    );

    const inProgress = rows.filter(
      (r) => normStatus(r.status) === "IN PROGRESS"
    );

    return { waiting, needs, scheduled, inProgress };
  }, [rows]);

  /* REQUEST CARD --------------------------------------------- */

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

    function fmtWindow(start?: string | null, end?: string | null) {
      if (!start) return "—";

      const s = new Date(start);
      const e = end ? new Date(end) : null;
      const sFmt = s.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      if (!e) return sFmt;

      const eFmt = e.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });

      return `${sFmt} → ${eFmt}`;
    }

    return (
      <li
        draggable
        onDragStart={(e) =>
          e.dataTransfer.setData("request-id", r.id)
        }
        onClick={onClick}
        className={`rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col gap-4 ${toneClass}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-700 font-medium">
              {fmtWindow(r.scheduled_start_at, r.scheduled_end_at)}
            </div>

            {r.technician && (
              <div className="text-[11px] text-gray-500">
                Tech: {r.technician.full_name || "—"}
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

        {/* BODY */}
        <div className="space-y-1 text-sm text-gray-800">
          <div>
            <span className="text-gray-500">Service:</span>{" "}
            {r.service || "—"}
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
                  r.vehicle.unit_number &&
                    `#${r.vehicle.unit_number}`,
                  r.vehicle.year,
                  r.vehicle.make,
                  r.vehicle.model,
                  r.vehicle.plate &&
                    `(${r.vehicle.plate})`,
                ]
                  .filter(Boolean)
                  .join(" ")
              : "—"}
          </div>
        </div>

        {/* THUMBS */}
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

  /* RENDER PAGE ------------------------------------------------ */

  return (
    <div className="px-6 py-10 space-y-10">
      {/* WAITING */}
      <div>
        <h2 className="font-semibold text-lg mb-3">
          Waiting to Schedule
        </h2>
        <ul className="space-y-4">
          {grouped.waiting.map((r) => (
            <TeslaLaneCard
              key={r.id}
              r={r}
              thumbs={thumbsByReq[r.id] || []}
              tone="white"
              onClick={() => openDrawer(r.id)}
            />
          ))}
        </ul>
      </div>

      {/* TECH LANES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {techs.map((t) => (
          <div key={t.id} className="flex flex-col gap-4">
            <div className="font-semibold text-sm">
              {t.full_name}
            </div>

            <TechLaneDropZone
              tech={t}
              onDropRequest={(reqId, techId) => {
                openDrawer(reqId);
                setTimeout(() => {
                  setDrawerData((d: any) =>
                    d ? { ...d, technician_id: techId } : d
                  );
                }, 50);
              }}
            >
              <ul className="space-y-4">
                {grouped.scheduled
                  .filter((r) => r.technician?.id === t.id)
                  .map((r) => (
                    <TeslaLaneCard
                      key={r.id}
                      r={r}
                      thumbs={thumbsByReq[r.id] || []}
                      tone="blue"
                      onClick={() => openDrawer(r.id)}
                    />
                  ))}
              </ul>
            </TechLaneDropZone>
          </div>
        ))}
      </div>

      {/* DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 overflow-y-auto space-y-6">
            {!drawerLoading && drawerData && (
              <button
                className="w-full bg-amber-600 text-white py-2 rounded-lg text-sm hover:bg-amber-700 transition"
                onClick={async () => {
                  try {
                    const resp = await fetch(
                      `/api/requests/${drawerData.id}`,
                      {
                        method: "PATCH",
                        credentials: "include",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          status: "RESCHEDULE",
                        }),
                      }
                    );

                    if (!resp.ok) {
                      const js = await resp.json();
                      alert(js.error || "Failed to reschedule");
                      return;
                    }

                    alert("Request moved to RESCHEDULE.");
                    load();
                    closeDrawer();
                  } catch (err) {
                    console.error(err);
                    alert("Failed to reschedule");
                  }
                }}
              >
                Reschedule Request
              </button>
            )}

            {drawerLoading ? (
              <div>Loading…</div>
            ) : (
              drawerData && (
                <TeslaTechAssignCard
                  request={drawerData}
                  techs={techs}
                  onUpdate={() => {
                    closeDrawer();
                    load();
                  }}
                />
              )
            )}
          </div>

          <div className="flex-1" onClick={closeDrawer} />
        </div>
      )}
    </div>
  );
}



