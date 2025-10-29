// app/dispatch/queue/ui/DispatchQueueClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  status: string | null;
  technician_id: string | null;
  scheduled_for: string | null;
  created_at: string | null;
  notes?: string | null;
  po_number?: string | null;
};

type Tech = { id: string; name: string };

function useTechnicians() {
  const [techs, setTechs] = useState<Tech[]>([]);
  useEffect(() => {
    fetch("/api/lookups?scope=technicians")
      .then((r) => r.json())
      .then((j) => setTechs(Array.isArray(j?.data) ? j.data : []))
      .catch(() => setTechs([]));
  }, []);
  return techs;
}

export default function DispatchQueueClient() {
  const [tab, setTab] = useState<"ready" | "scheduled" | "all">("ready");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const techs = useTechnicians();
  const [assign, setAssign] = useState<{ [id: string]: { techId: string; when: string } }>({});

  const query = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("status", tab);
    qs.set("limit", "200");
    return `/api/dispatch/queue?${qs.toString()}`;
  }, [tab]);

  const refresh = () => {
    setLoading(true);
    fetch(query)
      .then((r) => r.json())
      .then((j) => setRows(Array.isArray(j?.data) ? j.data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const schedule = async (id: string) => {
    const cfg = assign[id] || { techId: "", when: "" };
    if (!cfg.techId || !cfg.when) {
      alert("Pick a technician and a date/time first.");
      return;
    }
    const res = await fetch(`/api/requests/${id}/schedule`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ technician_id: cfg.techId, scheduled_for: cfg.when }),
    }).then((r) => r.json());
    if (!res?.ok) {
      alert(res?.error || "Failed to schedule");
      return;
    }
    refresh();
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {(["ready", "scheduled", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-md border ${t === tab ? "bg-gray-100" : "hover:bg-gray-50"}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
        <button onClick={refresh} className="ml-2 border rounded-md px-3 py-1 hover:bg-gray-50">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-500">No requests.</div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {rows.map((r) => {
            const cfg = assign[r.id] || { techId: r.technician_id ?? "", when: r.scheduled_for ?? "" };
            return (
              <li key={r.id} className="p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      #{r.id.slice(0, 8)}{" "}
                      <span className="font-normal text-gray-500">•</span>{" "}
                      <span className="uppercase text-xs tracking-wide px-2 py-0.5 rounded-full border">
                        {r.status ?? "NEW"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {r.scheduled_for ? (
                        <>Scheduled: {new Date(r.scheduled_for).toLocaleString()}</>
                      ) : (
                        <>Created: {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</>
                      )}
                    </div>
                    {r.notes ? <div className="text-xs text-gray-700 mt-1 line-clamp-2">{r.notes}</div> : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      className="border rounded-md px-2 py-1"
                      value={cfg.techId}
                      onChange={(e) =>
                        setAssign((s) => ({ ...s, [r.id]: { ...cfg, techId: e.target.value } }))
                      }
                    >
                      <option value="">Pick technician…</option>
                      {techs.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="datetime-local"
                      className="border rounded-md px-2 py-1"
                      value={cfg.when}
                      onChange={(e) =>
                        setAssign((s) => ({ ...s, [r.id]: { ...cfg, when: e.target.value } }))
                      }
                    />

                    <button
                      className="border rounded-md px-3 py-1 hover:bg-gray-50"
                      onClick={() => schedule(r.id)}
                      title="Schedule with technician"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
