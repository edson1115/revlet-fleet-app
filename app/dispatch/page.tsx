// app/dispatch/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

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
  notes?: string | null; // Office notes
  dispatch_notes?: string | null; // Dispatcher notes
  mileage?: number | null;
  priority?: string | null;
  created_at?: string;
  scheduled_at?: string | null;
  customer?: Customer;
  vehicle?: Vehicle;
  location?: Location;
  technician?: { id: UUID; name?: string | null } | null;
};

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
function toLocalDateTimeInputValue(dt?: string | null) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
function fromLocalDateTimeInputValue(val: string) {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// Tiny debounce
function useDebounced(fn: () => void, delay = 350) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(() => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => fn(), delay);
  }, [fn, delay]);
}

// Lazy Supabase client
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

/* ============================
   Inline editor: Dispatcher Notes
   ============================ */
function DispatchNotesEditor({
  requestId,
  initial,
  onSaved,
}: {
  requestId: string;
  initial?: string | null;
  onSaved?: (next: string | null) => void;
}) {
  const [notes, setNotes] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      await postJSON("/api/requests", { op: "notes", id: requestId, dispatch_notes: notes });
      onSaved?.(notes.trim() ? notes : null);
    } catch (e: any) {
      setErr(e?.message || "Failed to save notes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2">
      <label className="text-sm font-medium">Dispatcher Notes</label>
      <textarea
        className="mt-1 w-full border rounded-lg p-2 text-sm"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add instructions for the technician…"
      />
      <div className="mt-1 flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          {saving ? "Saving…" : "Save notes"}
        </button>
        {err && <span className="text-xs text-red-600">{err}</span>}
      </div>
    </div>
  );
}

/* ============================
   Inline scheduler
   ============================ */
function Scheduler({
  request,
  techs,
  onScheduled,
}: {
  request: RequestRow;
  techs: Technician[];
  onScheduled: (updated: Partial<RequestRow>) => void;
}) {
  const [techId, setTechId] = useState(request.technician?.id || "");
  const [dt, setDt] = useState(toLocalDateTimeInputValue(request.scheduled_at));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const payload: any = {
        id: request.id,
        technician_id: techId || null,
        scheduled_at: fromLocalDateTimeInputValue(dt),
      };
      await postJSON("/api/requests/schedule", payload);
      const techName =
        techId
          ? (techs.find((t) => t.id === techId)?.full_name ||
             techs.find((t) => t.id === techId)?.name ||
             null)
          : null;
      onScheduled({
        technician: techId ? { id: techId, name: techName } : null,
        scheduled_at: payload.scheduled_at,
        status: techId ? "SCHEDULED" : request.status,
      });
    } catch (e: any) {
      setErr(e?.message || "Failed to schedule");
    } finally {
      setSaving(false);
    }
  }

  const picked =
    techId
      ? (techs.find((t) => t.id === techId)?.full_name ||
         techs.find((t) => t.id === techId)?.name ||
         "Technician")
      : "Technician";

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr,220px,200px]">
      <select
        className="border rounded-lg px-3 py-2 text-sm"
        value={techId}
        onChange={(e) => setTechId(e.target.value)}
      >
        <option value="">Assign technician…</option>
        {techs.map((t) => (
          <option key={t.id} value={t.id}>
            {t.full_name || t.name || "Unnamed"}
          </option>
        ))}
      </select>

      <input
        type="datetime-local"
        className="border rounded-lg px-3 py-2 text-sm"
        value={dt}
        onChange={(e) => setDt(e.target.value)}
      />

      <button
        onClick={save}
        disabled={saving}
        className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
        title={techId ? `Save to ${picked} Schedule` : "Save to Technician Schedule"}
      >
        {saving ? "Saving…" : techId ? `Save to ${picked} Schedule` : "Save to Technician Schedule"}
      </button>

      {err && <div className="sm:col-span-3 text-xs text-red-600">{err}</div>}
    </div>
  );
}

export default function DispatchPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(
    "WAITING TO BE SCHEDULED,SCHEDULED,RESCHEDULE"
  );

  const supabase = useSupabaseClient();

  // Load function as stable callback (so debounce + effects are tidy)
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("status", statusFilter);
      qs.set("sortBy", "scheduled_at");
      qs.set("sortDir", "asc");
      const out = await getJSON<{ rows: RequestRow[] }>(`/api/requests?${qs.toString()}`);
      const data = out?.rows || [];
      data.sort((a, b) => {
        const da = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
        const db = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      });
      setRows(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const debouncedReload = useDebounced(load, 300);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const list = await getJSON<{ rows?: Technician[] } | Technician[]>("/api/techs?active=1");
        const rows = Array.isArray(list) ? list : list?.rows || [];
        setTechs((rows || []).filter((t) => t && (t.active ?? true)));
      } catch {
        // ignore
      }
    })();
  }, []);

  // Realtime: refresh on any service_requests change the user is allowed to see by RLS
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("dispatch-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_requests" },
        () => debouncedReload()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, debouncedReload]);

  const grouped = useMemo(() => {
    const waiting = rows.filter((r) => r.status === "WAITING TO BE SCHEDULED");
    const scheduled = rows.filter((r) => r.status === "SCHEDULED");
    const needsReschedule = rows.filter((r) => r.status === "RESCHEDULE");
    return { waiting, scheduled, needsReschedule };
  }, [rows]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dispatch</h1>
          <p className="text-sm text-gray-600">
            Assign technicians, set dates, and leave dispatcher notes for the Tech app.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Filter</label>
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="WAITING TO BE SCHEDULED,SCHEDULED,RESCHEDULE">
              Waiting + Scheduled + Reschedule
            </option>
            <option value="WAITING TO BE SCHEDULED,SCHEDULED">Waiting + Scheduled</option>
            <option value="WAITING TO BE SCHEDULED">Waiting only</option>
            <option value="SCHEDULED">Scheduled only</option>
            <option value="RESCHEDULE">Reschedule only</option>
          </select>
          <button onClick={load} className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50" disabled={loading}>
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* Waiting */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Waiting to be scheduled</h2>
        {grouped.waiting.length === 0 ? (
          <div className="text-gray-500 text-sm">Nothing waiting.</div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-3">
            {grouped.waiting.map((r) => (
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
                        ].filter(Boolean).join(" ") || "—"
                      : "—"}
                  </div>
                  {r.notes ? (
                    <div className="text-gray-700"><span className="font-medium">Office Notes:</span> {r.notes}</div>
                  ) : null}
                  {r.dispatch_notes ? (
                    <div className="text-gray-700"><span className="font-medium">Dispatcher Notes:</span> {r.dispatch_notes}</div>
                  ) : null}
                </div>

                <Scheduler
                  request={r}
                  techs={techs}
                  onScheduled={(upd) =>
                    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...upd } as RequestRow : x)))
                  }
                />
                <DispatchNotesEditor
                  requestId={r.id}
                  initial={r.dispatch_notes}
                  onSaved={(next) =>
                    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, dispatch_notes: next } : x)))
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Needs Reschedule */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Needs reschedule</h2>
        {grouped.needsReschedule.length === 0 ? (
          <div className="text-gray-500 text-sm">No reschedule requests.</div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-3">
            {grouped.needsReschedule.map((r) => (
              <li key={r.id} className="rounded-2xl border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">—</div>
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
                        ].filter(Boolean).join(" ") || "—"
                      : "—"}
                  </div>
                  {r.notes ? (
                    <div className="text-gray-700"><span className="font-medium">Office Notes:</span> {r.notes}</div>
                  ) : null}
                  {r.dispatch_notes ? (
                    <div className="text-gray-700"><span className="font-medium">Dispatcher Notes:</span> {r.dispatch_notes}</div>
                  ) : null}
                </div>

                <Scheduler
                  request={r}
                  techs={techs}
                  onScheduled={(upd) =>
                    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...upd } as RequestRow : x)))
                  }
                />
                <DispatchNotesEditor
                  requestId={r.id}
                  initial={r.dispatch_notes}
                  onSaved={(next) =>
                    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, dispatch_notes: next } : x)))
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Scheduled */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Scheduled</h2>
        {grouped.scheduled.length === 0 ? (
          <div className="text-gray-500 text-sm">No scheduled jobs.</div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-3">
            {grouped.scheduled.map((r) => (
              <li key={r.id} className="rounded-2xl border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">{fmtDateTime(r.scheduled_at)}</div>
                  <span className="text-xs rounded-full border px-2 py-1">{r.status}</span>
                </div>

                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Technician:</span> {r.technician?.name || "Unassigned"}</div>
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
                        ].filter(Boolean).join(" ") || "—"
                      : "—"}
                  </div>
                  {r.notes ? (
                    <div className="text-gray-700"><span className="font-medium">Office Notes:</span> {r.notes}</div>
                  ) : null}
                  {r.dispatch_notes ? (
                    <div className="text-gray-700"><span className="font-medium">Dispatcher Notes:</span> {r.dispatch_notes}</div>
                  ) : null}
                </div>

                <Scheduler
                  request={r}
                  techs={techs}
                  onScheduled={(upd) =>
                    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...upd } as RequestRow : x)))
                  }
                />
                <DispatchNotesEditor
                  requestId={r.id}
                  initial={r.dispatch_notes}
                  onSaved={(next) =>
                    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, dispatch_notes: next } : x)))
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
