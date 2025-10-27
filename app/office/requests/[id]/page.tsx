// app/office/requests/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import NotesBox from "@/components/NotesBox";

type UUID = string;
type Status =
  | "NEW"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "WAITING_APPROVAL"
  | "WAITING_PARTS"
  | "DECLINED";

type Vehicle = {
  year: number | null;
  make: string | null;
  model: string | null;
  unit_number?: string | null;
  plate?: string | null;
};

type RequestRow = {
  id: UUID;
  status: Status;
  service: string | null;
  fmc: string | null;
  mileage: number | null;
  po?: string | null;            // primary
  po_number?: string | null;     // legacy alias
  notes: string | null;
  scheduled_at: string | null;
  preferred_window_start: string | null;
  preferred_window_end: string | null;
  priority: string | null;
  updated_at?: string | null;
  location?: { name: string | null } | null;
  customer?: { name: string | null } | null;
  vehicle?: Vehicle | null;
  technician?: { id?: string; full_name?: string | null } | null; // show assigned tech
};

type Tech = { id: UUID; name: string };

function statusBadge(s?: Status) {
  if (!s) return null;
  const base = "inline-flex items-center px-2 py-0.5 rounded text-xs border";
  const map: Record<Status, string> = {
    NEW: "bg-yellow-50 border-yellow-300 text-yellow-800",
    SCHEDULED: "bg-blue-50 border-blue-300 text-blue-800",
    IN_PROGRESS: "bg-purple-50 border-purple-300 text-purple-800",
    COMPLETED: "bg-green-50 border-green-300 text-green-800",
    WAITING_APPROVAL: "bg-orange-50 border-orange-300 text-orange-800",
    WAITING_PARTS: "bg-amber-50 border-amber-300 text-amber-800",
    DECLINED: "bg-rose-50 border-rose-300 text-rose-800",
  };
  return <span className={`${base} ${map[s]}`}>{s}</span>;
}

function vehicleLabel(v?: Vehicle | null) {
  if (!v) return "—";
  const base = [v.year, v.make, v.model].filter(Boolean).join(" ");
  const extras = [v.unit_number ? `#${v.unit_number}` : null, v.plate ? `(${v.plate})` : null]
    .filter(Boolean)
    .join(" ");
  return [base || "—", extras].filter(Boolean).join(" ");
}

export default function OfficeRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [row, setRow] = useState<RequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // editable fields
  const [fmc, setFmc] = useState("");
  const [mileage, setMileage] = useState<string>("");
  const [po, setPo] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<string>("NORMAL");
  const [pws, setPws] = useState<string>(""); // preferred_window_start (datetime-local)
  const [pwe, setPwe] = useState<string>(""); // preferred_window_end   (datetime-local)

  const [saving, setSaving] = useState(false);

  // schedule modal
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedAt, setSchedAt] = useState<string>("");
  const [techs, setTechs] = useState<Tech[]>([]);
  const [techId, setTechId] = useState<UUID | "">("");

  const canStart = useMemo(
    () => row && (row.status === "NEW" || row.status === "SCHEDULED"),
    [row]
  );
  const canComplete = useMemo(() => row && row.status === "IN_PROGRESS", [row]);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/requests/${id}`, { credentials: "include" });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to load");

      const r: RequestRow = js.request;
      setRow(r);
      setFmc(r.fmc ?? "");
      setMileage(r.mileage != null ? String(r.mileage) : "");
      setPo(r.po ?? r.po_number ?? "");
      setNotes(r.notes ?? "");
      setPriority(r.priority ?? "NORMAL");
      setPws(r.preferred_window_start ? r.preferred_window_start.slice(0, 16) : "");
      setPwe(r.preferred_window_end ? r.preferred_window_end.slice(0, 16) : "");
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
      setRow(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSave = async () => {
    if (!row) return;
    setSaving(true);
    setErr(null);
    try {
      const body: any = {
        fmc: fmc || null,
        po, // send primary; server also accepts po_number
        notes: notes || null,
        priority: priority || null,
        mileage: mileage ? Number(mileage) : null,
        preferred_window_start: pws ? new Date(pws).toISOString() : null,
        preferred_window_end: pwe ? new Date(pwe).toISOString() : null,
        expected_updated_at: row.updated_at ?? null,
      };

      const res = await fetch(`/api/requests/${row.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to save");

      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onStart = async () => {
    if (!row) return;
    setErr(null);
    await fetch(`/api/requests/${row.id}/start`, { method: "PATCH", credentials: "include" });
    await load();
  };

  const onComplete = async () => {
    if (!row) return;
    setErr(null);
    await fetch(`/api/requests/${row.id}/complete`, { method: "PATCH", credentials: "include" });
    await load();
  };

  const openSchedule = async () => {
    if (!row) return;

    // prefill date
    const now = new Date();
    const isoLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setSchedAt(row.scheduled_at ? row.scheduled_at.slice(0, 16) : isoLocal);

    // load technicians (active only)
    try {
      const res = await fetch(`/api/lookups?scope=technicians&active=1`, { credentials: "include" });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to load technicians");
      const list: Tech[] = (js.data || []).map((t: any) => ({ id: t.id, name: t.name }));
      setTechs(list);
      // preselect current tech if present
      setTechId((row.technician?.id as UUID) || "");
    } catch (e: any) {
      // keep modal usable even if tech fetch fails
      setTechs([]);
      setTechId((row.technician?.id as UUID) || "");
    }

    setSchedOpen(true);
  };

  const onSchedule = async () => {
    if (!row) return;
    setSchedOpen(false);
    setErr(null);
    await fetch(`/api/requests/${row.id}/schedule`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduled_at: schedAt ? new Date(schedAt).toISOString() : null,
        technician_id: techId || null,
      }),
    });
    await load();
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (!row) return <div className="p-6">{err || "Not found."}</div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="text-sm">
        <Link href="/office/queue" className="text-blue-600 hover:underline">
          ← Back to Office queue
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Request #{row.id.slice(0, 8)}</h1>
        <div className="flex items-center gap-2">{statusBadge(row.status)}</div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h2 className="font-semibold mb-2">Customer</h2>
          <div className="text-sm">{row.customer?.name ?? "—"}</div>
        </div>
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h2 className="font-semibold mb-2">Location</h2>
          <div className="text-sm">{row.location?.name ?? "—"}</div>
        </div>
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h2 className="font-semibold mb-2">Vehicle</h2>
          <div className="text-sm">{vehicleLabel(row.vehicle)}</div>
        </div>
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h2 className="font-semibold mb-2">Technician</h2>
          <div className="text-sm">{row.technician?.full_name ?? "—"}</div>
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-2xl border p-4 bg-white shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Service</label>
            <div className="w-full rounded-lg border px-3 py-2 bg-gray-50">
              {row.service ?? "—"}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="NORMAL">NORMAL</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">FMC</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={fmc}
              onChange={(e) => setFmc(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mileage</label>
            <input
              type="number"
              className="w-full rounded-lg border px-3 py-2"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">PO</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={po}
              onChange={(e) => setPo(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Preferred Window (Start)
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border px-3 py-2"
              value={pws}
              onChange={(e) => setPws(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Preferred Window (End)
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border px-3 py-2"
              value={pwe}
              onChange={(e) => setPwe(e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="w-full rounded-lg border px-3 py-2"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>

          <button className="rounded-lg border px-4 py-2" onClick={openSchedule}>
            Schedule…
          </button>

          {canStart && (
            <button className="rounded-lg border px-4 py-2" onClick={onStart}>
              Start
            </button>
          )}
          {canComplete && (
            <button className="rounded-lg border px-4 py-2" onClick={onComplete}>
              Complete
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border p-4 bg-white shadow-sm">
        <h2 className="font-semibold mb-3">Timeline</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <span className="opacity-60">Scheduled:</span>{" "}
            {row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : "—"}
          </li>
          <li>
            <span className="opacity-60">Preferred Window:</span>{" "}
            {pws ? new Date(pws).toLocaleString() : "—"} →{" "}
            {pwe ? new Date(pwe).toLocaleString() : "—"}
          </li>
        </ul>
      </div>

      {/* Notes */}
      <div className="rounded-2xl border p-4 bg-white shadow-sm">
        <NotesBox requestId={row.id} canAdd />
      </div>

      {/* Schedule Modal */}
      {schedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Set Schedule</h3>
              <button
                className="text-sm text-gray-600"
                onClick={() => setSchedOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date &amp; time</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border px-3 py-2"
                  value={schedAt}
                  onChange={(e) => setSchedAt(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Technician</label>
                <select
                  className="w-full rounded-lg border px-3 py-2"
                  value={techId}
                  onChange={(e) => setTechId(e.target.value as UUID)}
                >
                  <option value="">— Unassigned —</option>
                  {techs.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {techs.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    No technicians found. Add them under <code>/admin/techs</code>.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                className="rounded-lg border px-4 py-2"
                onClick={() => setSchedOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-black px-4 py-2 text-white"
                onClick={onSchedule}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {err && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}
    </div>
  );
}
