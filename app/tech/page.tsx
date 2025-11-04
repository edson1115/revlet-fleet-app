// app/tech/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ===== Types =====
type UUID = string;

type Technician = {
  id: UUID;
  name?: string | null;
  full_name?: string | null;
  label?: string | null;
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
  status:
    | "NEW"
    | "WAITING TO BE SCHEDULED"
    | "SCHEDULED"
    | "IN PROGRESS"
    | "COMPLETED"
    | "RESCHEDULE"
    | string;
  created_at?: string;
  scheduled_at?: string | null;
  started_at?: string | null;     // ← added
  completed_at?: string | null;   // ← added
  service?: string | null;
  notes?: string | null;
  dispatch_notes?: string | null;
  customer?: Customer;
  location?: Location;
  vehicle?: Vehicle;
  technician?: { id: UUID; name?: string | null } | null;
};

const STORAGE_KEY = "revlet.tech.currentTechId";

// ===== Utils =====
async function getJSON<T>(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return (await res.json()) as T;
}

async function postJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return (await res.json()) as T;
}

function fmtDateTime(dt?: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt || "—";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(d?: string | null) {
  if (!d) return false;
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return false;
  const now = new Date();
  return (
    t.getFullYear() === now.getFullYear() &&
    t.getMonth() === now.getMonth() &&
    t.getDate() === now.getDate()
  );
}

// Optional: tiny Supabase client for realtime
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

// ===== Component =====
export default function TechPage() {
  const supabase = useSupabaseClient();

  const [techs, setTechs] = useState<Technician[]>([]);
  const [techId, setTechId] = useState<string | null>(null);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  // Load tech list
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await getJSON<{ rows?: Technician[] } | Technician[]>("/api/techs?active=1");
        const raw = Array.isArray(list) ? list : list?.rows || [];
        if (!mounted) return;
        setTechs(
          (raw || [])
            .filter((t) => t && (t.active ?? true))
            .map((t) => ({ ...t, name: t.name ?? t.full_name ?? t.label ?? "" }))
        );
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load technicians");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Initialize selected tech from localStorage
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved) setTechId(saved);
  }, []);

  // Persist selected tech
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (techId) window.localStorage.setItem(STORAGE_KEY, techId);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [techId]);

  // Fetch jobs for this tech (Scheduled + In Progress + Reschedule)
  const fetchJobs = useCallback(async () => {
    if (!techId) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("technician_id", techId);
      qs.set("status", "SCHEDULED,DISPATCHED,IN PROGRESS,RESCHEDULE");
      const out = await getJSON<{ rows: RequestRow[] }>(`/api/requests?${qs.toString()}`);
      const data = out?.rows || [];
      // Sort by scheduled_at (nulls last)
      data.sort((a, b) => {
        const da = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
        const db = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      });
      setRows(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [techId]);

  // Load jobs when tech changes
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Realtime: refresh when relevant rows change (RLS will scope)
  useEffect(() => {
    if (!supabase || !techId) return;
    const channel = supabase
      .channel(`tech-${techId}-requests`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_requests", filter: `technician_id=eq.${techId}` },
        () => fetchJobs()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, techId, fetchJobs]);

  // Helpers
  const setBusy = (id: string, v: boolean) =>
    setBusyIds((prev) => ({ ...prev, [id]: v }));

  const mutateStatus = async (id: string, nextStatus: "IN PROGRESS" | "COMPLETED") => {
    setError(null);
    setBusy(id, true);
    const prev = rows;
    const optimistic = prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r));
    setRows(optimistic);
    try {
      await postJSON("/api/requests/batch", {
        op: "status",
        ids: [id],
        status: nextStatus,
      });
      await fetchJobs();
    } catch (e: any) {
      setError(e?.message || "Failed to update status");
      setRows(prev);
    } finally {
      setBusy(id, false);
    }
  };

  const submitReschedule = async (id: string, reason: string) => {
    setError(null);
    setBusy(id, true);
    try {
      await postJSON("/api/requests/batch", {
        op: "reschedule",
        ids: [id],
        note: reason,
      });
      await fetchJobs();
    } catch (e: any) {
      setError(e?.message || "Failed to request reschedule");
    } finally {
      setBusy(id, false);
    }
  };

  // Grouping: today's scheduled grouped by customer
  const scheduledToday = useMemo(
  () =>
    rows.filter(
      (r) =>
        (r.status === "SCHEDULED" || r.status === "DISPATCHED") &&
        isToday(r.scheduled_at)
    ),
  [rows]
);


  const inProgress = useMemo(() => rows.filter((r) => r.status === "IN PROGRESS"), [rows]);
  const needsReschedule = useMemo(() => rows.filter((r) => r.status === "RESCHEDULE"), [rows]);

  const byCustomerToday = useMemo(() => {
    const map = new Map<string, { customerId: string; customerName: string; jobs: RequestRow[] }>();
    for (const r of scheduledToday) {
      const cid = r.customer?.id || "unknown";
      const cname = r.customer?.name || "Unknown Customer";
      if (!map.has(cid)) {
        map.set(cid, { customerId: cid, customerName: cname, jobs: [] });
      }
      map.get(cid)!.jobs.push(r);
    }
    return Array.from(map.values()).sort((a, b) => a.customerName.localeCompare(b.customerName));
  }, [scheduledToday]);

  // ===== Render =====
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Jobs</h1>
          <p className="text-sm text-gray-600">
            View today’s schedule, grouped by customer. Start a job when you arrive; complete it when you’re done.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">I am</label>
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={techId || ""}
            onChange={(e) => setTechId(e.target.value || null)}
          >
            <option value="" disabled>
              Select technician…
            </option>
            {techs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name || "Unnamed"}
              </option>
            ))}
          </select>
          <button
            onClick={fetchJobs}
            className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
            disabled={!techId || loading}
            title="Refresh"
          >
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {!techId ? (
        <div className="text-gray-600 text-sm">Pick your name above to load your jobs.</div>
      ) : loading ? (
        <div className="text-gray-600 text-sm">Loading…</div>
      ) : (
        <>
          {/* Scheduled Today grouped by Customer */}
          <section className="space-y-3">
            <h2 className="text-lg font-medium">Today’s Scheduled (grouped by customer)</h2>
            {byCustomerToday.length === 0 ? (
              <div className="text-gray-500 text-sm">Nothing scheduled for today.</div>
            ) : (
              <ul className="space-y-3">
                {byCustomerToday.map((group) => {
                  const isOpen = expandedCustomer === group.customerId;
                  return (
                    <li key={group.customerId} className="rounded-2xl border p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{group.customerName}</div>
                        <button
                          className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50"
                          onClick={() => setExpandedCustomer(isOpen ? null : group.customerId)}
                        >
                          {isOpen
                            ? "Hide vehicles"
                            : `Show ${group.jobs.length} vehicle${group.jobs.length > 1 ? "s" : ""}`}
                        </button>
                      </div>

                      {isOpen && (
                        <ul className="mt-3 grid md:grid-cols-2 gap-3">
                          {group.jobs.map((r) => (
                            <li key={r.id} className="rounded-xl border p-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-sm font-semibold">{fmtDateTime(r.scheduled_at)}</div>
                                <span className="text-xs rounded-full border px-2 py-0.5">{r.status}</span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div><span className="font-medium">Service:</span> {r.service || "—"}</div>
                                <div><span className="font-medium">Location:</span> {r.location?.name || "—"}</div>
                                <div>
                                  <span className="font-medium">Vehicle:</span>{" "}
                                  {r.vehicle
                                    ? [
                                        r.vehicle.unit_number && `#${r.vehicle.unit_number}`,
                                        r.vehicle.year,
                                        r.vehicle.make,
                                        r.vehicle.model,
                                        r.vehicle.plate && `(${r.vehicle.plate})`,
                                      ]
                                        .filter(Boolean)
                                        .join(" ") || "—"
                                    : "—"}
                                </div>
                                {r.notes ? (
                                  <div className="text-gray-700">
                                    <span className="font-medium">Office Notes:</span> {r.notes}
                                  </div>
                                ) : null}
                                {r.dispatch_notes ? (
                                  <div className="text-gray-700">
                                    <span className="font-medium">Dispatcher Notes:</span> {r.dispatch_notes}
                                  </div>
                                ) : null}

                                {/* NEW: Proof-of-work stamps */}
                                {(r as any).started_at ? (
                                  <div className="text-gray-600">
                                    <span className="font-medium">Started:</span>{" "}
                                    {fmtDateTime((r as any).started_at)}
                                  </div>
                                ) : null}
                                {(r as any).completed_at ? (
                                  <div className="text-gray-600">
                                    <span className="font-medium">Completed:</span>{" "}
                                    {fmtDateTime((r as any).completed_at)}
                                  </div>
                                ) : null}
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  className="rounded-xl px-3 py-2 text-sm border hover:bg-gray-50"
                                  disabled={!!busyIds[r.id]}
                                  onClick={() => mutateStatus(r.id, "IN PROGRESS")}
                                >
                                  {busyIds[r.id] ? "Starting…" : "Start"}
                                </button>

                                <RescheduleButton
                                  busy={!!busyIds[r.id]}
                                  onSubmit={(reason) => submitReschedule(r.id, reason)}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* In Progress */}
          <section className="space-y-3">
            <h2 className="text-lg font-medium">In Progress</h2>
            {inProgress.length === 0 ? (
              <div className="text-gray-500 text-sm">No active jobs.</div>
            ) : (
              <ul className="grid md:grid-cols-2 gap-3">
                {inProgress.map((r) => (
                  <li key={r.id} className="rounded-2xl border p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold">{fmtDateTime(r.scheduled_at)}</div>
                      <span className="text-xs rounded-full border px-2 py-1">{r.status}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Service:</span> {r.service || "—"}</div>
                      <div><span className="font-medium">Customer:</span> {r.customer?.name || "—"}</div>
                      <div><span className="font-medium">Location:</span> {r.location?.name || "—"}</div>
                      <div>
                        <span className="font-medium">Vehicle:</span>{" "}
                        {r.vehicle
                          ? [
                              r.vehicle.unit_number && `#${r.vehicle.unit_number}`,
                              r.vehicle.year,
                              r.vehicle.make,
                              r.vehicle.model,
                              r.vehicle.plate && `(${r.vehicle.plate})`,
                            ]
                              .filter(Boolean)
                              .join(" ") || "—"
                          : "—"}
                      </div>
                      {r.notes ? (
                        <div className="text-gray-600">
                          <span className="font-medium">Office Notes:</span> {r.notes}
                        </div>
                      ) : null}
                      {r.dispatch_notes ? (
                        <div className="text-gray-600">
                          <span className="font-medium">Dispatcher Notes:</span> {r.dispatch_notes}
                        </div>
                      ) : null}

                      {/* NEW: Proof-of-work stamps */}
                      {(r as any).started_at ? (
                        <div className="text-gray-600">
                          <span className="font-medium">Started:</span>{" "}
                          {fmtDateTime((r as any).started_at)}
                        </div>
                      ) : null}
                      {(r as any).completed_at ? (
                        <div className="text-gray-600">
                          <span className="font-medium">Completed:</span>{" "}
                          {fmtDateTime((r as any).completed_at)}
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        className="rounded-xl px-3 py-2 text-sm border hover:bg-gray-50"
                        disabled={!!busyIds[r.id]}
                        onClick={() => mutateStatus(r.id, "COMPLETED")}
                      >
                        {busyIds[r.id] ? "Completing…" : "Complete"}
                      </button>

                      <RescheduleButton
                        busy={!!busyIds[r.id]}
                        onSubmit={(reason) => submitReschedule(r.id, reason)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Needs Reschedule (feedback from Tech) */}
          <section className="space-y-3">
            <h2 className="text-lg font-medium">Needs Reschedule</h2>
            {needsReschedule.length === 0 ? (
              <div className="text-gray-500 text-sm">No reschedule requests pending.</div>
            ) : (
              <ul className="grid md:grid-cols-2 gap-3">
                {needsReschedule.map((r) => (
                  <li key={r.id} className="rounded-2xl border p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold">{fmtDateTime(r.scheduled_at)}</div>
                      <span className="text-xs rounded-full border px-2 py-1">{r.status}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Service:</span> {r.service || "—"}</div>
                      <div><span className="font-medium">Customer:</span> {r.customer?.name || "—"}</div>
                      <div><span className="font-medium">Location:</span> {r.location?.name || "—"}</div>
                      {r.notes ? (
                        <div className="text-gray-600">
                          <span className="font-medium">Office Notes:</span> {r.notes}
                        </div>
                      ) : null}
                      {r.dispatch_notes ? (
                        <div className="text-gray-600">
                          <span className="font-medium">Dispatcher Notes:</span> {r.dispatch_notes}
                        </div>
                      ) : null}

                      {/* If a job made it here after tech requested reschedule, it might also have completed/started stamps */}
                      {(r as any).started_at ? (
                        <div className="text-gray-600">
                          <span className="font-medium">Started:</span>{" "}
                          {fmtDateTime((r as any).started_at)}
                        </div>
                      ) : null}
                      {(r as any).completed_at ? (
                        <div className="text-gray-600">
                          <span className="font-medium">Completed:</span>{" "}
                          {fmtDateTime((r as any).completed_at)}
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// ===== Small helper component for rescheduling =====
function RescheduleButton({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const submit = () => {
    const text = reason.trim();
    if (!text) return;
    onSubmit(text);
    setOpen(false);
    setReason("");
  };

  if (!open) {
    return (
      <button
        className="rounded-xl px-3 py-2 text-sm border hover:bg-gray-50"
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        {busy ? "…" : "Reschedule"}
      </button>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <textarea
        className="w-full border rounded-lg p-2 text-sm"
        rows={3}
        placeholder="Reason (keys not available, customer cancelled, wrong parts, vehicle not found, …)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          className="rounded-xl px-3 py-2 text-sm border hover:bg-gray-50"
          disabled={busy || !reason.trim()}
          onClick={submit}
        >
          Submit Reschedule
        </button>
        <button
          className="rounded-xl px-3 py-2 text-sm border hover:bg-gray-50"
          onClick={() => {
            setOpen(false);
            setReason("");
          }}
        >
            Cancel
        </button>
      </div>
    </div>
  );
}
