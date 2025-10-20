// app/dispatch/assign/ui/AssignClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Id = string;
type Tech = { id: Id; full_name?: string | null; email?: string | null };

async function getJSON<T>(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

async function patchJSON(url: string, body: any) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res;
}

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export default function AssignClient() {
  const [requestId, setRequestId] = useState<Id | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [techs, setTechs] = useState<Tech[]>([]);
  const [selected, setSelected] = useState<Set<Id>>(new Set());
  const [prevScheduled, setPrevScheduled] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    const url = new URL(window.location.href);
    const id = url.searchParams.get("id");
    if (id) setRequestId(id as Id);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setErr("");

        // Load techs
        const t = await getJSON<{ techs?: Tech[]; rows?: Tech[]; options?: Tech[] }>("/api/lookups?scope=techs");
        const list: Tech[] = (t.techs ?? t.rows ?? t.options ?? []) as Tech[];
        setTechs(list);

        if (requestId) {
          // Load request (for previous schedule/status and pre-selected techs)
          const req = await getJSON<any>(`/api/requests?id=${encodeURIComponent(requestId)}`);
          const r =
            Array.isArray(req) ? req.find((x) => x.id === requestId) :
            req?.rows?.find?.((x: any) => x.id === requestId) ?? req;

          if (r?.scheduled_at) {
            setPrevScheduled(r.scheduled_at);
            setScheduledAt(toLocalInputValue(new Date(r.scheduled_at)));
          } else {
            const d = new Date();
            d.setMinutes(0, 0, 0);
            d.setHours(d.getHours() + 1);
            setScheduledAt(toLocalInputValue(d));
          }
          if (r?.status) setStatus(r.status);
          if (Array.isArray(r?.request_techs) && r.request_techs.length) {
            setSelected(new Set(r.request_techs as string[]));
          }
        }
      } catch (e: any) {
        setErr(e?.message || "Failed to load.");
      }
    })();
  }, [requestId]);

  const selectedArr = useMemo(() => Array.from(selected), [selected]);

  async function save() {
    if (!requestId) return;
    setErr("");
    try {
      const iso = new Date(scheduledAt).toISOString();
      await patchJSON(`/api/requests/${requestId}/schedule`, {
        scheduled_at: iso,
        request_techs: selectedArr,
      });
      // Stay in Dispatch flow after assignment
      window.location.href = "/dispatch/scheduled";
    } catch (e: any) {
      setErr(e?.message || "Failed to save assignment.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <Link className="text-blue-600 underline" href="/dispatch/scheduled">Back to Dispatch</Link>
        <Link className="text-blue-600 underline" href="/office/queue">Office Queue</Link>
      </div>

      <div className="rounded-2xl border p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Date/time */}
          <div>
            <label className="text-sm font-medium">Scheduled date &amp; time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              Previously: {prevScheduled ? new Date(prevScheduled).toLocaleString() : "Not scheduled"}
            </div>
          </div>

          {/* Techs */}
          <div>
            <label className="text-sm font-medium">Technicians</label>
            <div className="rounded-xl border px-2 py-2 max-h-40 overflow-auto">
              {techs.length === 0 ? (
                <div className="text-sm text-gray-500 px-2 py-1">No techs found.</div>
              ) : techs.map((t) => {
                const name = t.full_name || t.email || t.id;
                const checked = selected.has(t.id);
                return (
                  <label key={t.id} className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${checked ? "bg-gray-100" : "hover:bg-gray-50"}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(selected);
                        e.target.checked ? next.add(t.id) : next.delete(t.id);
                        setSelected(next);
                      }}
                    />
                    <span className="text-sm">{name}</span>
                  </label>
                );
              })}
            </div>
            <div className="text-xs text-gray-500 mt-1">Selected techs: {selected.size}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => history.back()} className="rounded-xl border px-4 py-2">Cancel</button>
          <button onClick={save} className="rounded-xl bg-blue-600 text-white px-4 py-2">Save Assignment</button>
        </div>
      </div>

      {requestId ? (
        <div className="rounded-xl border p-3 text-xs text-gray-600">
          <div><b>Request ID:</b> {requestId}</div>
          <div><b>Status:</b> {status ?? "Unknown"}</div>
        </div>
      ) : null}

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
      ) : null}
    </div>
  );
}
