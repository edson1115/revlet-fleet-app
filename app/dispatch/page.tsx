// app/dispatch/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import ImageCountPill from "../../components/images/ImageCountPill";
import Lightbox from "../../components/common/Lightbox";

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
  notes?: string | null;          // Office notes
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

// Images
type Thumb = {
  id: string;
  kind: "before" | "after" | "other" | string;
  url_thumb: string;
  url_work: string;
  taken_at?: string;
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
  const js = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(js?.error || res.statusText);
  return js as T;
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
/** Default next business day at 04:00 (local) for <input type="datetime-local"> */
function defaultNextBusinessDay4amLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const day = d.getDay(); // 0 Sun, 6 Sat
  if (day === 6) d.setDate(d.getDate() + 2);
  if (day === 0) d.setDate(d.getDate() + 1);
  d.setHours(4, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
    <div className="mt-3 grid gap-2 sm:grid-cols:[1fr,220px,200px] sm:grid-cols-[1fr,220px,200px]">
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

  // include IN_PROGRESS in the default combined view so Dispatch can see active jobs
  const [statusFilter, setStatusFilter] = useState<string>(
    "WAITING_TO_BE_SCHEDULED,SCHEDULED,RESCHEDULE,IN_PROGRESS"
  );

  // NEW: selection + batch scheduling state
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);
  const [toolbarTechId, setToolbarTechId] = useState<string>("");
  const [toolbarDtLocal, setToolbarDtLocal] = useState<string>(defaultNextBusinessDay4amLocal());
  const [banner, setBanner] = useState<string>("");

  // Images state
  const [thumbsByReq, setThumbsByReq] = useState<Record<string, Thumb[]>>({});
  const [lbOpen, setLbOpen] = useState(false);
  const [lbImages, setLbImages] = useState<{ url_work: string; alt?: string }[]>([]);
  const [lbIndex, setLbIndex] = useState(0);

  function openLightbox(requestId: string, startUrl?: string) {
    const arr = thumbsByReq[requestId] || [];
    const imgs = arr.map((t) => ({ url_work: t.url_work, alt: `${t.kind} photo` }));
    const idx = startUrl ? Math.max(0, imgs.findIndex((i) => i.url_work === startUrl)) : 0;
    setLbImages(imgs);
    setLbIndex(idx < 0 ? 0 : idx);
    setLbOpen(true);
  }

  function countKinds(arr: Thumb[] | undefined) {
    const a = arr || [];
    let before = 0, after = 0, other = 0;
    for (const t of a) {
      if (t.kind === "before") before++;
      else if (t.kind === "after") after++;
      else other++;
    }
    return { total: a.length, before, after, other };
  }

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

      // Hydrate image thumbs for visible requests
      const ids = Array.from(new Set(data.map((r) => r.id)));
      if (ids.length) {
        const param = encodeURIComponent(ids.join(","));
        const thumbs = await getJSON<{ byRequest: Record<string, Thumb[]> }>(
          `/api/images/list?request_ids=${param}`
        );
        setThumbsByReq(thumbs.byRequest || {});
      } else {
        setThumbsByReq({});
      }
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
    const waiting = rows.filter((r) => r.status === "WAITING_TO_BE_SCHEDULED");
    const scheduled = rows.filter((r) => r.status === "SCHEDULED");
    const needsReschedule = rows.filter((r) => r.status === "RESCHEDULE");
    const inProgress = rows.filter((r) => r.status === "IN_PROGRESS");
    return { waiting, scheduled, needsReschedule, inProgress };
  }, [rows]);

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }
  function clearSel() {
    setSelected({});
  }
  function selectAll(list: RequestRow[]) {
    setSelected((prev) => ({ ...prev, ...Object.fromEntries(list.map((r) => [r.id, true])) }));
  }

  // ===== Batch actions (uses /api/requests/batch) =====
  async function batchAssign() {
    if (!selectedIds.length) return setBanner("Select at least one request.");
    if (!toolbarTechId) return setBanner("Choose a technician first.");
    try {
      await postJSON("/api/requests/batch", {
        op: "assign",
        ids: selectedIds,
        technician_id: toolbarTechId,
      });
      setBanner(`Assigned ${selectedIds.length} request(s).`);
      clearSel();
      await load();
    } catch (e: any) {
      setBanner(e?.message || "Failed to assign");
    }
  }
  async function batchSchedule() {
    if (!selectedIds.length) return setBanner("Select at least one request.");
    if (!toolbarTechId) return setBanner("Choose a technician first.");
    try {
      // ensure assigned (idempotent)
      await postJSON("/api/requests/batch", {
        op: "assign",
        ids: selectedIds,
        technician_id: toolbarTechId,
      });
      // schedule + flip to SCHEDULED
      await postJSON("/api/requests/batch", {
        op: "reschedule",
        ids: selectedIds,
        scheduled_at: toolbarDtLocal,
        status: "SCHEDULED",
      });
      setBanner(`Scheduled ${selectedIds.length} request(s) for ${new Date(toolbarDtLocal).toLocaleString()}.`);
      clearSel();
      await load();
    } catch (e: any) {
      setBanner(e?.message || "Failed to schedule");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dispatch</h1>
          <p className="text-sm text-gray-600">
            Assign technicians, set dates, and review proof photos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Filter</label>
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="WAITING_TO_BE_SCHEDULED,SCHEDULED,RESCHEDULE,IN_PROGRESS">
              Waiting + Scheduled + Reschedule + In Progress
            </option>
            <option value="WAITING_TO_BE_SCHEDULED,SCHEDULED,RESCHEDULE">
              Waiting + Scheduled + Reschedule
            </option>
            <option value="WAITING_TO_BE_SCHEDULED,SCHEDULED">Waiting + Scheduled</option>
            <option value="WAITING_TO_BE_SCHEDULED">Waiting only</option>
            <option value="SCHEDULED">Scheduled only</option>
            <option value="RESCHEDULE">Reschedule only</option>
            <option value="IN_PROGRESS">In Progress only</option>
          </select>
          <button onClick={load} className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50" disabled={loading}>
            Refresh
          </button>
        </div>
      </header>

      {/* Batch toolbar */}
      <div className="rounded-xl border p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr,220px,auto,auto] sm:items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Technician</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={toolbarTechId}
              onChange={(e) => setToolbarTechId(e.target.value)}
            >
              <option value="">— choose technician —</option>
              {techs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || t.name || "Unnamed"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date & time</label>
            <input
              type="datetime-local"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={toolbarDtLocal}
              onChange={(e) => setToolbarDtLocal(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Defaults to next business day at 4:00 AM.</p>
          </div>
          <button onClick={batchAssign} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm">
            Assign Selected
          </button>
          <button onClick={batchSchedule} className="px-3 py-2 rounded-lg bg-black text-white hover:bg-gray-800 text-sm">
            Schedule Selected
          </button>
        </div>
        {!!selectedIds.length && (
          <div className="text-xs text-gray-600 mt-2">
            {selectedIds.length} selected
          </div>
        )}
      </div>

      {banner && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {banner}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* Waiting */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Waiting to be scheduled</h2>
          {grouped.waiting.length > 0 && (
            <div className="flex gap-3">
              <button className="text-sm underline" onClick={() => selectAll(grouped.waiting)}>Select all</button>
              <button className="text-sm underline" onClick={clearSel}>Clear</button>
            </div>
          )}
        </div>
        {grouped.waiting.length === 0 ? (
          <div className="text-gray-500 text-sm">Nothing waiting.</div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-3">
            {grouped.waiting.map((r) => {
              const c = countKinds(thumbsByReq[r.id]);
              return (
                <li key={r.id} className="rounded-2xl border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!selected[r.id]}
                        onChange={() => toggle(r.id)}
                        aria-label="select request"
                      />
                      <div className="text-sm font-semibold">{fmtDateTime(r.scheduled_at)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ImageCountPill
                        total={c.total} before={c.before} after={c.after} other={c.other}
                        onClick={() => openLightbox(r.id)}
                      />
                      <span className="text-xs rounded-full border px-2 py-1">{r.status}</span>
                    </div>
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

                  {/* Optional tiny thumb strip */}
                  {thumbsByReq[r.id]?.length ? (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {thumbsByReq[r.id].slice(0, 6).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => openLightbox(r.id, t.url_work)}
                          title={t.kind}
                          className="border rounded-lg overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={t.url_thumb} alt={`${t.kind} thumb`} className="h-12 w-12 object-cover block" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  ) : null}

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
              );
            })}
          </ul>
        )}
      </section>

      {/* Needs Reschedule */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Needs reschedule</h2>
          {grouped.needsReschedule.length > 0 && (
            <div className="flex gap-3">
              <button className="text-sm underline" onClick={() => selectAll(grouped.needsReschedule)}>Select all</button>
              <button className="text-sm underline" onClick={clearSel}>Clear</button>
            </div>
          )}
        </div>
        {grouped.needsReschedule.length === 0 ? (
          <div className="text-gray-500 text-sm">No reschedule requests.</div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-3">
            {grouped.needsReschedule.map((r) => {
              const c = countKinds(thumbsByReq[r.id]);
              return (
                <li key={r.id} className="rounded-2xl border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!selected[r.id]}
                        onChange={() => toggle(r.id)}
                        aria-label="select request"
                      />
                      <div className="text-sm font-semibold">—</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ImageCountPill
                        total={c.total} before={c.before} after={c.after} other={c.other}
                        onClick={() => openLightbox(r.id)}
                      />
                      <span className="text-xs rounded-full border px-2 py-1">{r.status}</span>
                    </div>
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

                  {thumbsByReq[r.id]?.length ? (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {thumbsByReq[r.id].slice(0, 6).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => openLightbox(r.id, t.url_work)}
                          title={t.kind}
                          className="border rounded-lg overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={t.url_thumb} alt={`${t.kind} thumb`} className="h-12 w-12 object-cover block" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  ) : null}

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
              );
            })}
          </ul>
        )}
      </section>

      {/* Scheduled */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Scheduled</h2>
          {grouped.scheduled.length > 0 && (
            <div className="flex gap-3">
              <button className="text-sm underline" onClick={() => selectAll(grouped.scheduled)}>Select all</button>
              <button className="text-sm underline" onClick={clearSel}>Clear</button>
            </div>
          )}
        </div>
        {grouped.scheduled.length === 0 ? (
          <div className="text-gray-500 text-sm">No scheduled jobs.</div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-3">
            {grouped.scheduled.map((r) => {
              const c = countKinds(thumbsByReq[r.id]);
              return (
                <li key={r.id} className="rounded-2xl border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!selected[r.id]}
                        onChange={() => toggle(r.id)}
                        aria-label="select request"
                      />
                      <div className="text-sm font-semibold">{fmtDateTime(r.scheduled_at)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ImageCountPill
                        total={c.total} before={c.before} after={c.after} other={c.other}
                        onClick={() => openLightbox(r.id)}
                      />
                      <span className="text-xs rounded-full border px-2 py-1">{r.status}</span>
                    </div>
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

                  {thumbsByReq[r.id]?.length ? (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {thumbsByReq[r.id].slice(0, 6).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => openLightbox(r.id, t.url_work)}
                          title={t.kind}
                          className="border rounded-lg overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={t.url_thumb} alt={`${t.kind} thumb`} className="h-12 w-12 object-cover block" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  ) : null}

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
              );
            })}
          </ul>
        )}
      </section>

      {/* In Progress (read-only for visibility) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">In Progress</h2>
        </div>
        {grouped.inProgress.length === 0 ? (
          <div className="text-gray-500 text-sm">No active jobs.</div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-3">
            {grouped.inProgress.map((r) => {
              const c = countKinds(thumbsByReq[r.id]);
              return (
                <li key={r.id} className="rounded-2xl border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold">{fmtDateTime(r.scheduled_at)}</div>
                    <div className="flex items-center gap-2">
                      <ImageCountPill
                        total={c.total} before={c.before} after={c.after} other={c.other}
                        onClick={() => openLightbox(r.id)}
                      />
                      <span className="text-xs rounded-full border px-2 py-1">{r.status}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Technician:</span> {r.technician?.name || "Unassigned"}</div>
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
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Lightbox
        open={lbOpen}
        images={lbImages}
        index={lbIndex}
        onClose={() => setLbOpen(false)}
        onIndex={(i) => setLbIndex(i)}
      />
    </div>
  );
}
