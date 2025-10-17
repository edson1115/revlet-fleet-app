// app/fm/requests/new/RequestsViewer.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Id = string;
type SR = {
  id: Id;
  status:
    | "NEW"
    | "WAITING_APPROVAL"
    | "WAITING_PARTS"
    | "DECLINED"
    | "SCHEDULED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CLOSED";
  service: string | null;
  fmc: string | null;
  mileage: number | null;
  po: string | null;
  notes: string | null;
  created_at: string;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  vehicle?: {
    year: number | null;
    make: string | null;
    model: string | null;
    plate?: string | null;
    unit_number?: string | null;
  } | null;
  customer?: { name: string | null } | null;
};

async function fetchJSON<T>(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

async function fetchStatus(status: string, limit = 20) {
  return fetchJSON<{ requests: SR[] }>(
    `/api/requests?status=${encodeURIComponent(status)}&limit=${limit}`
  );
}

const TABS = [
  { key: "ACTIVE", label: "Active", statuses: ["NEW", "WAITING_APPROVAL", "WAITING_PARTS", "DECLINED"] as const },
  { key: "SCHEDULED", label: "Scheduled", statuses: ["SCHEDULED"] as const },
  { key: "IN_PROGRESS", label: "In progress", statuses: ["IN_PROGRESS"] as const },
  { key: "COMPLETED", label: "Completed", statuses: ["COMPLETED"] as const },
] as const;

const STATUS_LABEL: Record<string, string> = {
  NEW: "NEW",
  WAITING_APPROVAL: "WAITING APPROVAL",
  WAITING_PARTS: "WAITING PARTS",
  DECLINED: "DECLINED",
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN PROGRESS",
  COMPLETED: "COMPLETED",
  CLOSED: "CLOSED",
};

function Badge({ s }: { s: string }) {
  const base = "inline-block rounded-full border px-2 py-0.5 text-[10px] tracking-wide";
  const tone =
    s === "NEW" ? "bg-blue-50 border-blue-200" :
    s === "SCHEDULED" ? "bg-indigo-50 border-indigo-200" :
    s === "IN_PROGRESS" ? "bg-amber-50 border-amber-200" :
    s === "COMPLETED" ? "bg-emerald-50 border-emerald-200" :
    s === "DECLINED" ? "bg-rose-50 border-rose-200" :
    s === "WAITING_PARTS" ? "bg-purple-50 border-purple-200" :
    s === "WAITING_APPROVAL" ? "bg-slate-50 border-slate-200" :
    "bg-gray-50 border-gray-200";
  return <span className={`${base} ${tone}`}>{STATUS_LABEL[s] ?? s}</span>;
}

function Item({ r }: { r: SR }) {
  const v = r.vehicle || {};
  const vehicle = [v?.year, v?.make, v?.model, v?.plate || v?.unit_number]
    .filter(Boolean)
    .join(" ") || "—";
  const customer = r.customer?.name || "—";
  const when = r.completed_at || r.started_at || r.scheduled_at || r.created_at;

  return (
    <li className="rounded-xl border p-3 hover:bg-gray-50 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{customer}</div>
          <div className="text-xs text-gray-600 truncate">{vehicle}</div>
          <div className="text-xs text-gray-500 truncate">
            {r.service || "—"} {r.fmc ? <>• {r.fmc}</> : null}
            {r.mileage ? <> • {r.mileage} mi</> : null}
          </div>
          {r.po ? <div className="text-[11px] text-gray-500">PO: {r.po}</div> : null}
          {r.notes ? (
            <div className="text-[11px] text-gray-500 line-clamp-2">Notes: {r.notes}</div>
          ) : null}
          <div className="text-[11px] text-gray-400 mt-1">
            {new Date(when || r.created_at).toLocaleString()}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge s={r.status} />
          <a className="text-[11px] underline text-gray-600" href="/office/queue" title="Open Office Queue">
            Open in Office
          </a>
        </div>
      </div>
    </li>
  );
}

export default function RequestsViewer() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("ACTIVE");
  const [data, setData] = useState<Record<string, SR[]>>({
    NEW: [],
    WAITING_APPROVAL: [],
    WAITING_PARTS: [],
    DECLINED: [],
    SCHEDULED: [],
    IN_PROGRESS: [],
    COMPLETED: [],
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  async function loadOnce() {
    setErr("");
    try {
      const [a, b, c, d, e, f, g] = await Promise.all([
        fetchStatus("NEW"),
        fetchStatus("WAITING_APPROVAL"),
        fetchStatus("WAITING_PARTS"),
        fetchStatus("DECLINED"),
        fetchStatus("SCHEDULED"),
        fetchStatus("IN_PROGRESS"),
        fetchStatus("COMPLETED"),
      ]);
      setData({
        NEW: a.requests || [],
        WAITING_APPROVAL: b.requests || [],
        WAITING_PARTS: c.requests || [],
        DECLINED: d.requests || [],
        SCHEDULED: e.requests || [],
        IN_PROGRESS: f.requests || [],
        COMPLETED: g.requests || [],
      });
    } catch (e: any) {
      setErr(e?.message || "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOnce();
    const t = setInterval(loadOnce, 10_000);
    return () => clearInterval(t);
  }, []);

  const current = useMemo(() => {
    const def = TABS.find((t) => t.key === activeTab)!;
    const arr = def.statuses.flatMap((s) => data[s] || []);
    return [...arr].sort((a, b) => {
      const ta = new Date(a.completed_at || a.started_at || a.scheduled_at || a.created_at).getTime();
      const tb = new Date(b.completed_at || b.started_at || b.scheduled_at || b.created_at).getTime();
      return tb - ta;
    });
  }, [activeTab, data]);

  const counts = {
    ACTIVE:
      (data.NEW?.length ?? 0) +
      (data.WAITING_APPROVAL?.length ?? 0) +
      (data.WAITING_PARTS?.length ?? 0) +
      (data.DECLINED?.length ?? 0),
    SCHEDULED: data.SCHEDULED?.length ?? 0,
    IN_PROGRESS: data.IN_PROGRESS?.length ?? 0,
    COMPLETED: data.COMPLETED?.length ?? 0,
  };

  return (
    <aside className="rounded-2xl border bg-white p-4 md:sticky md:top-4 h-fit">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Requests Viewer</h3>
        <button onClick={loadOnce} className="text-xs rounded border px-2 py-0.5" title="Refresh">
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 text-xs mb-3">
        {TABS.map((t) => {
          const is = activeTab === t.key;
          const pill = t.key === "ACTIVE" ? counts.ACTIVE : (counts as any)[t.key] ?? 0;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`rounded-full border px-3 py-1 ${is ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"}`}
            >
              {t.label} {pill ? `(${pill})` : ""}
            </button>
          );
        })}
      </div>

      {err ? (
        <div className="text-xs text-red-600">{err}</div>
      ) : loading ? (
        <div className="text-xs text-gray-500">Loading…</div>
      ) : current.length === 0 ? (
        <div className="text-xs text-gray-500">No items.</div>
      ) : (
        <ul className="space-y-2">
          {current.map((r) => (
            <Item key={r.id} r={r} />
          ))}
        </ul>
      )}
    </aside>
  );
}
