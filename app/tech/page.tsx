// app/tech/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Lightbox from "@/components/common/Lightbox";

type UUID = string;

type Technician = { id: UUID; name?: string | null; full_name?: string | null; active?: boolean | null };

type Vehicle = {
  id: UUID;
  unit_number?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  plate?: string | null;
} | null;

type Row = {
  id: UUID;
  status: string;
  created_at?: string;
  scheduled_at?: string | null;
  service?: string | null;
  customer?: { id: string; name?: string | null } | null;
  location?: { id: string; name?: string | null } | null;
  vehicle?: Vehicle;
  technician?: { id: UUID; name?: string | null } | null;
  dispatch_notes?: string | null;
  notes?: string | null;
};

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
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultNextBusinessDay4amLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const day = d.getDay();
  if (day === 6) d.setDate(d.getDate() + 2);
  if (day === 0) d.setDate(d.getDate() + 1);
  d.setHours(4, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function useDebounced(fn: () => void, delay = 350) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(() => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => fn(), delay);
  }, [fn, delay]);
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

function Uploader({
  requestId,
  kind,
  onUploaded,
  className = "",
}: {
  requestId: string;
  kind: "before" | "after";
  onUploaded?: () => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("request_id", requestId);
      fd.append("kind", kind);
      for (const f of Array.from(files)) fd.append("files", f);
      const res = await fetch("/api/images/upload", { method: "POST", body: fd, credentials: "include" });
      const js = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(js?.error || "Upload failed");
      onUploaded?.();
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-xs text-gray-600">{kind === "before" ? "Before photos" : "After photos"}</label>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFiles(e.currentTarget.files)}
        className="text-xs"
      />
      {busy && <span className="text-xs text-gray-500">Uploading…</span>}
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}

export default function TechPage() {
  const [techs, setTechs] = useState<Technician[]>([]);
  const [techId, setTechId] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [thumbsByReq, setThumbsByReq] = useState<Record<string, Thumb[]>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Lightbox
  const [lbOpen, setLbOpen] = useState(false);
  const [lbImages, setLbImages] = useState<{ url_work: string; alt?: string }[]>([]);
  const [lbIndex, setLbIndex] = useState(0);

  // Reschedule modal
  const [rescheduleFor, setRescheduleFor] = useState<string | null>(null);
  const [reschedDt, setReschedDt] = useState<string>(defaultNextBusinessDay4amLocal());
  const [reschedNote, setReschedNote] = useState<string>("");

  // Complete modal
  const [completeFor, setCompleteFor] = useState<string | null>(null);
  const [completeNote, setCompleteNote] = useState<string>("");

  const debouncedReload = useDebounced(load, 300);

  useEffect(() => {
    const saved = window.localStorage.getItem("tech:selected_id");
    if (saved) setTechId(saved);
  }, []);
  useEffect(() => {
    if (techId) window.localStorage.setItem("tech:selected_id", techId);
  }, [techId]);

  useEffect(() => {
    (async () => {
      try {
        const list = await getJSON<{ rows?: Technician[] } | Technician[]>("/api/techs?active=1");
        const arr = Array.isArray(list) ? list : list?.rows || [];
        setTechs((arr || []).filter((t) => t && (t.active ?? true)));
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (techId) load();
  }, [techId]);

  async function load() {
    if (!techId) {
      setRows([]);
      setThumbsByReq({});
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const statuses = "SCHEDULED,IN_PROGRESS,RESCHEDULE";
      const qs = new URLSearchParams();
      qs.set("technician_id", techId);
      qs.set("status", statuses);
      qs.set("sortBy", "scheduled_at");
      qs.set("sortDir", "asc");
      const out = await getJSON<{ rows: Row[] }>(`/api/requests?${qs.toString()}`);
      const data = out?.rows || [];
      data.sort((a, b) => {
        const da = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
        const db = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      });
      setRows(data);

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
      setErr(e?.message || "Failed to load requests");
      setRows([]);
      setThumbsByReq({});
    } finally {
      setLoading(false);
    }
  }

  function openLightbox(requestId: string, startUrl?: string) {
    const arr = thumbsByReq[requestId] || [];
    const imgs = arr.map((t) => ({ url_work: t.url_work, alt: `${t.kind} photo` }));
    const idx = startUrl ? Math.max(0, imgs.findIndex((i) => i.url_work === startUrl)) : 0;
    setLbImages(imgs);
    setLbIndex(idx < 0 ? 0 : idx);
    setLbOpen(true);
  }

  async function startJob(id: string) {
    try {
      await postJSON("/api/requests/batch", { op: "status", ids: [id], status: "IN_PROGRESS" });
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to start job");
    }
  }

  function openComplete(id: string) {
    setCompleteFor(id);
    setCompleteNote("");
  }

  async function submitComplete() {
    if (!completeFor) return;
    try {
      await postJSON("/api/requests/batch", { op: "complete", ids: [completeFor], note: completeNote || undefined });
      setCompleteFor(null);
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to complete");
    }
  }

  function openReschedule(id: string) {
    setRescheduleFor(id);
    setReschedDt(defaultNextBusinessDay4amLocal());
    setReschedNote("");
  }

  async function submitReschedule() {
    if (!rescheduleFor) return;
    try {
      await postJSON("/api/requests/batch", {
        op: "reschedule",
        ids: [rescheduleFor],
        scheduled_at: reschedDt,
        status: "RESCHEDULE",
        note: reschedNote || undefined,
      });
      setRescheduleFor(null);
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to reschedule");
    }
  }

  const scheduled = useMemo(() => rows.filter((r) => r.status === "SCHEDULED"), [rows]);
  const inProgress = useMemo(() => rows.filter((r) => r.status === "IN_PROGRESS"), [rows]);
  const needsReschedule = useMemo(() => rows.filter((r) => r.status === "RESCHEDULE"), [rows]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tech</h1>
          <p className="text-sm text-gray-600">Your assigned jobs. Start → add before photos → complete with notes & after photos.</p>
        </div>

        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Technician</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm min-w-56"
              value={techId}
              onChange={(e) => setTechId(e.target.value)}
            >
              <option value="">— select technician —</option>
              {techs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || t.name || "Unnamed"}
                </option>
              ))}
            </select>
          </div>
          <button onClick={load} disabled={!techId || loading} className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
            Refresh
          </button>
        </div>
      </header>

      {!techId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Pick your name above to see your jobs.
        </div>
      )}

      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      <Section
        title="Scheduled"
        emptyText="No scheduled jobs."
        items={scheduled}
        thumbsByReq={thumbsByReq}
        onOpenLightbox={openLightbox}
        onUploaded={load}
        onStart={startJob}
        onComplete={openComplete}
        onReschedule={openReschedule}
        showStart
        showUploadBefore
      />

      <Section
        title="In Progress"
        emptyText="No active jobs."
        items={inProgress}
        thumbsByReq={thumbsByReq}
        onOpenLightbox={openLightbox}
        onUploaded={load}
        onStart={startJob}
        onComplete={openComplete}
        onReschedule={openReschedule}
        showUploadBefore
        showUploadAfter
      />

      <Section
        title="Needs Reschedule"
        emptyText="Nothing marked for reschedule."
        items={needsReschedule}
        thumbsByReq={thumbsByReq}
        onOpenLightbox={openLightbox}
        onUploaded={load}
        onStart={startJob}
        onComplete={openComplete}
        onReschedule={openReschedule}
        showStart
      />

      {/* Reschedule modal */}
      {rescheduleFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-4 space-y-3">
            <h3 className="text-lg font-semibold">Request reschedule</h3>
            <div className="space-y-2">
              <label className="block text-sm font-medium">New date &amp; time</label>
              <input
                type="datetime-local"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={reschedDt}
                onChange={(e) => setReschedDt(e.target.value)}
                min={toLocalDateTimeInputValue(new Date().toISOString())}
              />
              <label className="block text-sm font-medium mt-2">Reason (optional)</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={3}
                value={reschedNote}
                onChange={(e) => setReschedNote(e.target.value)}
                placeholder="Why are we rescheduling?"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 text-sm rounded-lg border" onClick={() => setRescheduleFor(null)}>Cancel</button>
              <button className="px-3 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800" onClick={submitReschedule}>
                Submit reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete modal */}
      {completeFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-4 space-y-3">
            <h3 className="text-lg font-semibold">Complete request</h3>
            <p className="text-sm text-gray-600">Add any notes or recommendations (optional).</p>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={4}
              value={completeNote}
              onChange={(e) => setCompleteNote(e.target.value)}
              placeholder="What was performed? Any recommendations?"
            />
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 text-sm rounded-lg border" onClick={() => setCompleteFor(null)}>Cancel</button>
              <button className="px-3 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800" onClick={submitComplete}>
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

      <Lightbox open={lbOpen} images={lbImages} index={lbIndex} onClose={() => setLbOpen(false)} onIndex={(i) => setLbIndex(i)} />
    </div>
  );
}

function Section(props: {
  title: string;
  emptyText: string;
  items: Row[];
  thumbsByReq: Record<string, Thumb[]>;
  onOpenLightbox: (requestId: string, startUrl?: string) => void;
  onUploaded: () => void;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onReschedule: (id: string) => void;
  showStart?: boolean;
  showComplete?: boolean;
  showUploadBefore?: boolean;
  showUploadAfter?: boolean;
}) {
  const {
    title,
    emptyText,
    items,
    thumbsByReq,
    onOpenLightbox,
    onUploaded,
    onStart,
    onComplete,
    onReschedule,
    showStart,
    showComplete = true,
    showUploadBefore,
    showUploadAfter,
  } = props;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{title}</h2>
      </div>
      {items.length === 0 ? (
        <div className="text-gray-500 text-sm">{emptyText}</div>
      ) : (
        <ul className="grid md:grid-cols-2 gap-3">
          {items.map((r) => (
            <Card
              key={r.id}
              row={r}
              thumbs={thumbsByReq[r.id] || []}
              onOpenLightbox={onOpenLightbox}
              onUploaded={onUploaded}
              onStart={onStart}
              onComplete={onComplete}
              onReschedule={onReschedule}
              showStart={showStart}
              showComplete={showComplete}
              showUploadBefore={showUploadBefore}
              showUploadAfter={showUploadAfter}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function Card(props: {
  row: Row;
  thumbs: Thumb[];
  onOpenLightbox: (requestId: string, startUrl?: string) => void;
  onUploaded: () => void;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onReschedule: (id: string) => void;
  showStart?: boolean;
  showComplete?: boolean;
  showUploadBefore?: boolean;
  showUploadAfter?: boolean;
}) {
  const {
    row: r,
    thumbs,
    onOpenLightbox,
    onUploaded,
    onStart,
    onComplete,
    onReschedule,
    showStart,
    showComplete,
    showUploadBefore,
    showUploadAfter,
  } = props;

  const c = countKinds(thumbs);

  return (
    <li className="rounded-2xl border p-4 shadow-sm">
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
        {r.dispatch_notes ? (
          <div className="text-gray-700"><span className="font-medium">Dispatch Notes:</span> {r.dispatch_notes}</div>
        ) : null}
      </div>

      {(showUploadBefore || showUploadAfter) && (
        <div className="mt-3 flex flex-wrap gap-3">
          {showUploadBefore && <Uploader requestId={r.id} kind="before" onUploaded={onUploaded} />}
          {showUploadAfter && <Uploader requestId={r.id} kind="after" onUploaded={onUploaded} />}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {thumbs.slice(0, 6).map((t) => (
            <button
              key={t.id}
              onClick={() => onOpenLightbox(r.id, t.url_work)}
              title={t.kind}
              className="border rounded-lg overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.url_thumb} alt={`${t.kind} thumb`} className="h-12 w-12 object-cover block" loading="lazy" />
            </button>
          ))}
        </div>
        <button
          onClick={() => onOpenLightbox(r.id)}
          className="text-xs rounded-full border px-2 py-1"
          title={`${c.total} photo${c.total !== 1 ? "s" : ""} (${c.before} before, ${c.after} after${c.other ? `, ${c.other} other` : ""})`}
        >
          {c.total} photos
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {showStart && (
          <button onClick={() => onStart(r.id)} className="px-3 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800">
            Start
          </button>
        )}
        {showComplete && (
          <button onClick={() => onComplete(r.id)} className="px-3 py-2 text-sm rounded-lg border">
            Complete
          </button>
        )}
        <button onClick={() => onReschedule(r.id)} className="px-3 py-2 text-sm rounded-lg border">
          Reschedule
        </button>
      </div>
    </li>
  );
}
