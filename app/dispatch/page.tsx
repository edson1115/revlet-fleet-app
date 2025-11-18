"use client";

// app/dispatch/page.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

import { supabaseBrowser } from "@/lib/supabase/browser";
import { normalizeRole, roleToPermissions } from "@/lib/permissions";
import { useLocationScope } from "@/lib/useLocationScope";

import ImageCountPill from "../../components/images/ImageCountPill";
import Lightbox from "../../components/common/Lightbox";

/* ============================================================
   TYPES
   ============================================================ */

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
  notes_from_tech?: string | null;
  tech_notes?: string | null;

  created_at?: string;
  scheduled_at?: string | null;

  customer?: Customer;
  vehicle?: Vehicle;
  location?: Location;

  technician?: {
    id: UUID;
    name?: string | null;
    full_name?: string | null;
  } | null;

  priority?: string | null;
  mileage?: number | null;
};

type Thumb = {
  id: string;
  kind: "before" | "after" | "other" | string;
  url_thumb: string;
  url_work: string;
  taken_at?: string;
};

type Bundle = {
  key: string;
  customerName: string;
  locationName: string;
  ids: string[];
  labels: string[];
};

/* ============================================================
   HELPERS
   ============================================================ */

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

async function postJSON<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const js = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(js?.error || res.statusText);
  return js as T;
}

function fmtDateTime(dt?: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleString();
}

function normStatus(s?: string | null) {
  return String(s || "").toUpperCase().replace(/_/g, " ");
}

function toLocalDateTimeInputValue(dt?: string | null) {
  if (!dt) return "";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
}

function fromLocalDateTimeInputValue(val: string) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function defaultNextBusinessDay4amLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 1);

  const day = d.getDay(); // Sun = 0, Sat = 6
  if (day === 6) d.setDate(d.getDate() + 2);
  if (day === 0) d.setDate(d.getDate() + 1);

  d.setHours(4, 0, 0, 0);
  return d.toISOString().slice(0, 16);
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

// Realtime client
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

/* ============================================================
   NOTES EDITOR
   ============================================================ */

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

  useEffect(() => setNotes(initial ?? ""), [initial]);

  async function save() {
    setSaving(true);
    try {
      await postJSON("/api/requests/batch", {
        op: "notes",
        ids: [requestId],
        dispatch_notes: notes.trim() || null,
      });
      onSaved?.(notes.trim() || null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2">
      <label className="text-xs font-medium">Dispatcher Notes</label>
      <textarea
        rows={3}
        className="w-full border rounded-lg p-2 text-xs mt-1"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button
        onClick={save}
        disabled={saving}
        className="mt-1 border rounded-lg px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save notes"}
      </button>
    </div>
  );
}

/* ============================================================
   INLINE SCHEDULER
   ============================================================ */

function Scheduler({
  request,
  techs,
  onScheduled,
}: {
  request: RequestRow;
  techs: Technician[];
  onScheduled: (r: Partial<RequestRow>) => void;
}) {
  const [techId, setTechId] = useState(request.technician?.id || "");
  const [dt, setDt] = useState(toLocalDateTimeInputValue(request.scheduled_at));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    try {
      setSaving(true);
      const iso = fromLocalDateTimeInputValue(dt);
      if (!iso) throw new Error("Invalid date/time");

      if (techId) {
        await postJSON("/api/requests/batch", {
          op: "assign",
          ids: [request.id],
          technician_id: techId,
        });
      }

      await postJSON("/api/requests/batch", {
        op: "reschedule",
        ids: [request.id],
        scheduled_at: iso,
        status: "SCHEDULED",
      });

      const tech = techs.find((t) => t.id === techId);
      const techName = tech?.full_name || tech?.name || null;

      onScheduled({
        technician: techId
          ? { id: techId, name: techName || null, full_name: techName || null }
          : null,
        scheduled_at: iso,
        status: "SCHEDULED",
      });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr,220px,200px]">
      <select
        className="border rounded-lg px-3 py-2 text-xs"
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
        className="border rounded-lg px-3 py-2 text-xs"
        value={dt}
        onChange={(e) => setDt(e.target.value)}
      />

      <button
        onClick={save}
        disabled={saving}
        className="border rounded-lg px-3 py-2 text-xs hover:bg-gray-50 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save schedule"}
      </button>

      {err && <div className="text-[10px] text-red-600">{err}</div>}
    </div>
  );
}

/* ============================================================
   SHARED INFO BLOCK
   ============================================================ */

function SharedInfo({ r }: { r: RequestRow }) {
  const techNotes = r.notes_from_tech || r.tech_notes;
  const dnotes = r.dispatch_notes || "";

  const isSendBack = dnotes.toLowerCase().startsWith("tech send-back:");

  return (
    <>
      <div>
        <span className="font-medium">Service:</span> {r.service || "—"}
      </div>
      <div>
        <span className="font-medium">Customer:</span>{" "}
        {r.customer?.name || "—"}
      </div>
      <div>
        <span className="font-medium">Location:</span>{" "}
        {r.location?.name || "—"}
      </div>
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
              .join(" ")
          : "—"}
      </div>

      {techNotes && (
        <div className="text-gray-700">
          <span className="font-medium">Notes from Tech:</span> {techNotes}
        </div>
      )}

      {isSendBack && (
        <div className="mt-1 inline-flex items-start gap-2 rounded-md bg-amber-50 border border-amber-300 px-2 py-1 text-[11px] text-amber-900">
          <span className="font-semibold uppercase tracking-wide">
            Tech send-back
          </span>
          <span>{dnotes.replace(/^tech send-back:\s*/i, "")}</span>
        </div>
      )}

      {!isSendBack && dnotes && (
        <div className="text-gray-700">
          <span className="font-medium">Dispatcher Notes:</span> {dnotes}
        </div>
      )}

      {r.notes && (
        <div className="text-gray-700">
          <span className="font-medium">Office Notes:</span> {r.notes}
        </div>
      )}
    </>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */

export default function DispatchPage() {
  const [canMutate, setCanMutate] = useState(false);

  // ---------------------------------------------
  // RBAC — determine if this user can dispatch
  // ---------------------------------------------
  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getSession();

      const raw =
        (data.session?.user?.app_metadata as any)?.role ?? "VIEWER";

      const role = normalizeRole(raw);
      const perms = roleToPermissions(role);

      setCanMutate(perms.canDispatch === true);
    })();
  }, []);

  const { locationId } = useLocationScope();

  const supabase = useSupabaseClient();

  const [rows, setRows] = useState<RequestRow[]>([]);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);

  const [toolbarTechId, setToolbarTechId] = useState("");
  const [toolbarDtLocal, setToolbarDtLocal] = useState(
    defaultNextBusinessDay4amLocal()
  );
  const [banner, setBanner] = useState("");

  const [statusFilter, setStatusFilter] = useState(
    "WAITING_TO_BE_SCHEDULED,SCHEDULED,RESCHEDULE,IN_PROGRESS"
  );

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected]
  );

  const [thumbsByReq, setThumbsByReq] = useState<Record<string, Thumb[]>>({});
  const [lbOpen, setLbOpen] = useState(false);
  const [lbImages, setLbImages] = useState<
    { url_work: string; alt?: string }[]
  >([]);
  const [lbIndex, setLbIndex] = useState(0);

  function openLightbox(reqId: string, start?: string) {
    const arr = thumbsByReq[reqId] || [];
    const imgs = arr.map((t) => ({ url_work: t.url_work, alt: t.kind }));
    const i = start
      ? imgs.findIndex((i) => i.url_work === start)
      : 0;
    setLbImages(imgs);
    setLbIndex(i < 0 ? 0 : i);
    setLbOpen(true);
  }

  // ---------------------------------------------
  // LOAD REQUESTS
  // ---------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("status", statusFilter);
      qs.set("sortBy", "scheduled_at");
      qs.set("sortDir", "asc");
      if (locationId) qs.set("location_id", locationId);

      const out = await getJSON<{ rows: RequestRow[] }>(
        `/api/requests?${qs.toString()}`
      );
      const data = out.rows || [];

      data.sort((a, b) => {
        const A = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
        const B = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
        return A - B;
      });

      setRows(data);

      const ids = [...new Set(data.map((r) => r.id))];
      if (ids.length) {
        const param = encodeURIComponent(ids.join(","));
        const thumbs = await getJSON<{
          byRequest: Record<string, Thumb[]>;
        }>(`/api/images/list?request_ids=${param}`);

        setThumbsByReq(thumbs.byRequest || {});
      } else {
        setThumbsByReq({});
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, locationId]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------------------------------------------
  // LOAD TECHS
  // ---------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const list = await getJSON<{ rows?: Technician[] } | Technician[]>(
          "/api/techs?active=1"
        );
        const items = Array.isArray(list) ? list : list.rows || [];
        setTechs(items.filter((t) => t && (t.active ?? true)));
      } catch {}
    })();
  }, []);

  // ---------------------------------------------
  // REALTIME SUBSCRIPTION
  // ---------------------------------------------
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("dispatch-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_requests" },
        () => load()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [supabase, load]);

  /* ============================================================
     GROUPED LANES
     ============================================================ */

  const grouped = useMemo(() => {
    const waiting = rows.filter(
      (r) =>
        normStatus(r.status) === "WAITING TO BE SCHEDULED" &&
        !(r.dispatch_notes || "").toLowerCase().startsWith("tech send-back:")
    );

    const scheduled = rows.filter(
      (r) => normStatus(r.status) === "SCHEDULED"
    );

    const needsReschedule = rows.filter((r) => {
      const isSchedule = normStatus(r.status) === "RESCHEDULE";
      const isSendBack = (r.dispatch_notes || "")
        .toLowerCase()
        .startsWith("tech send-back:");
      return isSchedule || isSendBack;
    });

    const inProgress = rows.filter(
      (r) => normStatus(r.status) === "IN PROGRESS"
    );

    return { waiting, scheduled, needsReschedule, inProgress };
  }, [rows]);

  /* ============================================================
     SELECTION
     ============================================================ */
  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function clearSel() {
    setSelected({});
  }

  function selectAll(list: RequestRow[]) {
    const next: Record<string, boolean> = {};
    list.forEach((r) => (next[r.id] = true));
    setSelected(next);
  }

  /* ============================================================
     BUNDLES
     ============================================================ */

  const bundles = useMemo<Bundle[]>(() => {
    const candidates = rows.filter(
      (r) =>
        normStatus(r.status) === "WAITING TO BE SCHEDULED" &&
        (!r.technician || !r.technician.id)
    );

    const map = new Map<string, Bundle>();

    for (const r of candidates) {
      const c = r.customer?.name || "Customer";
      const l = r.location?.name || "Location";
      const key = `${c}@@${l}`;

      const label = r.vehicle
        ? [
            r.vehicle.unit_number && `#${r.vehicle.unit_number}`,
            r.vehicle.year,
            r.vehicle.make,
            r.vehicle.model,
          ]
            .filter(Boolean)
            .join(" ")
        : r.service || r.id;

      const existing = map.get(key);

      const bundle =
        existing ||
        ({
          key,
          customerName: c,
          locationName: l,
          ids: [],
          labels: [],
        } as Bundle);

      bundle.ids.push(r.id);
      bundle.labels.push(label);

      map.set(key, bundle);
    }

    return [...map.values()].filter((b) => b.ids.length >= 2);
  }, [rows]);

  async function quickAssignBundle(b: Bundle) {
    if (!toolbarTechId) {
      setBanner("Choose a technician first.");
      return;
    }

    try {
      await postJSON("/api/requests/batch", {
        op: "assign",
        ids: b.ids,
        technician_id: toolbarTechId,
      });

      setBanner(`Assigned bundle for ${b.customerName} at ${b.locationName}.`);
      await load();
    } catch (e: any) {
      setBanner(e.message);
    }
  }

  async function quickScheduleBundle(b: Bundle) {
    if (!toolbarTechId) {
      setBanner("Choose a technician first.");
      return;
    }

    const iso = fromLocalDateTimeInputValue(toolbarDtLocal);
    if (!iso) {
      setBanner("Choose a valid date/time.");
      return;
    }

    try {
      await postJSON("/api/requests/batch", {
        op: "assign",
        ids: b.ids,
        technician_id: toolbarTechId,
      });

      await postJSON("/api/requests/batch", {
        op: "reschedule",
        ids: b.ids,
        scheduled_at: iso,
        status: "SCHEDULED",
      });

      setBanner(
        `Scheduled bundle (${b.customerName}, ${b.locationName}) for ${new Date(
          toolbarDtLocal
        ).toLocaleString()}.`
      );

      await load();
    } catch (e: any) {
      setBanner(e.message);
    }
  }

  /* ============================================================
     BATCH OPERATIONS
     ============================================================ */

  async function batchAssign() {
    if (!selectedIds.length) {
      setBanner("Select at least one request.");
      return;
    }
    if (!toolbarTechId) {
      setBanner("Choose a technician first.");
      return;
    }

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
      setBanner(e.message);
    }
  }

  async function batchSchedule() {
    if (!selectedIds.length) {
      setBanner("Select at least one request.");
      return;
    }
    if (!toolbarTechId) {
      setBanner("Choose a technician first.");
      return;
    }
    const iso = fromLocalDateTimeInputValue(toolbarDtLocal);
    if (!iso) {
      setBanner("Pick a valid date/time.");
      return;
    }

    try {
      await postJSON("/api/requests/batch", {
        op: "assign",
        ids: selectedIds,
        technician_id: toolbarTechId,
      });

      await postJSON("/api/requests/batch", {
        op: "reschedule",
        ids: selectedIds,
        scheduled_at: iso,
        status: "SCHEDULED",
      });

      setBanner(
        `Scheduled ${selectedIds.length} request(s) for ${new Date(
          toolbarDtLocal
        ).toLocaleString()}.`
      );

      clearSel();
      await load();
    } catch (e: any) {
      setBanner(e.message);
    }
  }

  const disableAssign =
    !canMutate || !selectedIds.length || !toolbarTechId;
  const disableSchedule =
    !canMutate ||
    !selectedIds.length ||
    !toolbarTechId ||
    !fromLocalDateTimeInputValue(toolbarDtLocal);

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* HEADER */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dispatch</h1>
          <p className="text-sm text-gray-600">
            Assign technicians, set scheduled dates, and review tech send-backs.
          </p>

          {!canMutate && (
            <span className="mt-2 inline-block text-xs rounded-full border px-2 py-0.5">
              Read-only (insufficient permissions)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Filter</label>
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="WAITING_TO_BE_SCHEDULED,SCHEDULED,RESCHEDULE,IN_PROGRESS">
              Waiting / Scheduled / Reschedule / In Progress
            </option>
            <option value="WAITING_TO_BE_SCHEDULED,SCHEDULED,RESCHEDULE">
              Waiting / Scheduled / Reschedule
            </option>
            <option value="WAITING_TO_BE_SCHEDULED,SCHEDULED">
              Waiting / Scheduled
            </option>
            <option value="WAITING_TO_BE_SCHEDULED">
              Waiting only
            </option>
            <option value="SCHEDULED">Scheduled only</option>
            <option value="RESCHEDULE">Reschedule only</option>
            <option value="IN_PROGRESS">In Progress only</option>
          </select>

          <button
            onClick={load}
            disabled={loading}
            className="border rounded-lg px-3 py-2 hover:bg-gray-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {/* BATCH TOOLBAR */}
      {canMutate && (
        <div className="rounded-xl border p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-[1fr,220px,auto,auto] sm:items-end">
            <div>
              <label className="block text-sm font-medium mb-1">
                Technician
              </label>
              <select
                className="border rounded-lg px-3 py-2 text-sm w-full"
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
              <label className="block text-sm font-medium mb-1">
                Date & time
              </label>
              <input
                type="datetime-local"
                className="border rounded-lg px-3 py-2 text-sm w-full"
                value={toolbarDtLocal}
                onChange={(e) => setToolbarDtLocal(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Defaults to next business day at 4:00 AM.
              </p>
            </div>

            <button
              disabled={disableAssign}
              onClick={batchAssign}
              className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm disabled:opacity-50"
            >
              Assign Selected
            </button>

            <button
              disabled={disableSchedule}
              onClick={batchSchedule}
              className="px-3 py-2 rounded-lg bg-black text-white hover:bg-gray-800 text-sm disabled:opacity-50"
            >
              Schedule Selected
            </button>
          </div>

          {selectedIds.length > 0 && (
            <div className="text-xs text-gray-600 mt-2">
              {selectedIds.length} selected
            </div>
          )}
        </div>
      )}

      {/* BANNER */}
      {banner && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {banner}
        </div>
      )}

      {/* Bundles */}
      {canMutate && bundles.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">
            Bundle opportunities (same customer + location)
          </h2>
          <div className="flex flex-col gap-2">
            {bundles.map((b) => (
              <div
                key={b.key}
                className="flex flex-wrap items-center justify-between gap-2 border rounded-lg px-3 py-2 text-xs"
              >
                <div>
                  <div className="font-medium">
                    {b.customerName} • {b.locationName}
                  </div>
                  <div className="text-gray-600">
                    {b.labels.join(" • ")}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 border rounded-lg hover:bg-gray-50"
                    onClick={() =>
                      setSelected((prev) => {
                        const next = { ...prev };
                        b.ids.forEach((id) => (next[id] = true));
                        return next;
                      })
                    }
                  >
                    Select all
                  </button>

                  <button
                    className="px-2 py-1 border rounded-lg hover:bg-gray-50"
                    onClick={() => quickAssignBundle(b)}
                  >
                    Assign bundle
                  </button>

                  <button
                    className="px-2 py-1 bg-black text-white rounded-lg hover:bg-gray-800"
                    onClick={() => quickScheduleBundle(b)}
                  >
                    Schedule bundle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* WAITING LANE */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Waiting to be scheduled</h2>

          {grouped.waiting.length > 0 && (
            <div className="flex gap-3">
              <button
                className="text-sm underline"
                onClick={() => selectAll(grouped.waiting)}
              >
                Select all
              </button>
              <button className="text-sm underline" onClick={clearSel}>
                Clear
              </button>
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
                        disabled={!canMutate}
                        checked={!!selected[r.id]}
                        onChange={() => toggle(r.id)}
                      />
                      <div className="text-xs text-gray-600">
                        Created: {fmtDateTime(r.created_at)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ImageCountPill
                        total={c.total}
                        before={c.before}
                        after={c.after}
                        other={c.other}
                        onClick={() => openLightbox(r.id)}
                      />
                      <span className="text-[10px] rounded-full border px-2 py-1">
                        {r.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <SharedInfo r={r} />
                  </div>

                  {thumbsByReq[r.id]?.length ? (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {thumbsByReq[r.id].slice(0, 6).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => openLightbox(r.id, t.url_work)}
                          className="border rounded-lg overflow-hidden"
                        >
                          <img
                            src={t.url_thumb}
                            className="h-12 w-12 object-cover block"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {canMutate && (
                    <>
                      <Scheduler
                        request={r}
                        techs={techs}
                        onScheduled={(upd) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, ...upd } : x
                            )
                          )
                        }
                      />

                      <DispatchNotesEditor
                        requestId={r.id}
                        initial={r.dispatch_notes}
                        onSaved={(next) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x.id === r.id
                                ? { ...x, dispatch_notes: next }
                                : x
                            )
                          )
                        }
                      />
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* NEEDS RESCHEDULE */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-amber-700">
          Needs Reschedule
        </h2>

        {grouped.needsReschedule.length === 0 ? (
          <div className="text-gray-500 text-sm">
            No jobs flagged for reschedule.
          </div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-3">
            {grouped.needsReschedule.map((r) => {
              const c = countKinds(thumbsByReq[r.id]);
              return (
                <li
                  key={r.id}
                  className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={!canMutate}
                        checked={!!selected[r.id]}
                        onChange={() => toggle(r.id)}
                      />
                      <div className="text-xs text-amber-800">
                        Last scheduled: {fmtDateTime(r.scheduled_at)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ImageCountPill
                        total={c.total}
                        before={c.before}
                        after={c.after}
                        other={c.other}
                        onClick={() => openLightbox(r.id)}
                      />
                      <span className="text-[10px] rounded-full border px-2 py-1 bg-amber-100">
                        {r.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <SharedInfo r={r} />
                  </div>

                  {thumbsByReq[r.id]?.length ? (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {thumbsByReq[r.id].slice(0, 6).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => openLightbox(r.id, t.url_work)}
                          className="border rounded-lg overflow-hidden"
                        >
                          <img
                            src={t.url_thumb}
                            className="h-12 w-12 object-cover block"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {canMutate && (
                    <>
                      <Scheduler
                        request={r}
                        techs={techs}
                        onScheduled={(upd) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, ...upd } : x
                            )
                          )
                        }
                      />

                      <DispatchNotesEditor
                        requestId={r.id}
                        initial={r.dispatch_notes}
                        onSaved={(next) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x.id === r.id
                                ? { ...x, dispatch_notes: next }
                                : x
                            )
                          )
                        }
                      />
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* SCHEDULED */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Scheduled</h2>

        {grouped.scheduled.length === 0 ? (
          <div className="text-gray-500 text-sm">No scheduled jobs.</div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-3">
            {grouped.scheduled.map((r) => {
              const c = countKinds(thumbsByReq[r.id]);
              return (
                <li key={r.id} className="rounded-2xl border p-4 shadow-sm">
                  <div className="flex justify-between mb-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-2 items-center">
                        <input
                          type="checkbox"
                          disabled={!canMutate}
                          checked={!!selected[r.id]}
                          onChange={() => toggle(r.id)}
                        />
                        <div className="text-xs font-semibold">
                          {fmtDateTime(r.scheduled_at)}
                        </div>
                      </div>

                      {r.technician && (
                        <div className="text-[10px] text-gray-600">
                          Tech:{" "}
                          {r.technician.full_name ||
                            r.technician.name ||
                            r.technician.id}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 items-center">
                      <ImageCountPill
                        total={c.total}
                        before={c.before}
                        after={c.after}
                        other={c.other}
                        onClick={() => openLightbox(r.id)}
                      />
                      <span className="text-[10px] rounded-full border px-2 py-1">
                        {r.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <SharedInfo r={r} />
                  </div>

                  {thumbsByReq[r.id]?.length ? (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {thumbsByReq[r.id].slice(0, 6).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => openLightbox(r.id, t.url_work)}
                          className="border rounded-lg overflow-hidden"
                        >
                          <img
                            src={t.url_thumb}
                            className="h-12 w-12 object-cover block"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {canMutate && (
                    <>
                      <Scheduler
                        request={r}
                        techs={techs}
                        onScheduled={(upd) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, ...upd } : x
                            )
                          )
                        }
                      />
                      <DispatchNotesEditor
                        requestId={r.id}
                        initial={r.dispatch_notes}
                        onSaved={(next) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x.id === r.id
                                ? { ...x, dispatch_notes: next }
                                : x
                            )
                          )
                        }
                      />
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* IN PROGRESS */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-sky-800">
          In Progress (read-only)
        </h2>

        {grouped.inProgress.length === 0 ? (
          <div className="text-gray-500 text-sm">No active jobs.</div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-3">
            {grouped.inProgress.map((r) => {
              const c = countKinds(thumbsByReq[r.id]);
              return (
                <li
                  key={r.id}
                  className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm"
                >
                  <div className="flex justify-between mb-2">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs font-semibold">
                        Started: {fmtDateTime(r.scheduled_at)}
                      </div>
                      {r.technician && (
                        <div className="text-[10px] text-gray-600">
                          Tech:{" "}
                          {r.technician.full_name ||
                            r.technician.name ||
                            r.technician.id}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 items-center">
                      <ImageCountPill
                        total={c.total}
                        before={c.before}
                        after={c.after}
                        other={c.other}
                        onClick={() => openLightbox(r.id)}
                      />
                      <span className="text-[10px] rounded-full border px-2 py-1 bg-sky-100">
                        {r.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <SharedInfo r={r} />
                  </div>

                  {thumbsByReq[r.id]?.length ? (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {thumbsByReq[r.id].slice(0, 6).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => openLightbox(r.id, t.url_work)}
                          className="border rounded-lg overflow-hidden"
                        >
                          <img
                            src={t.url_thumb}
                            className="h-12 w-12 object-cover block"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {/* In Progress = read-only (no scheduler or notes) */}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* LIGHTBOX */}
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
