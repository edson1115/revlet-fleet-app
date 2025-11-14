"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Id = string;

type RequestRow = {
  id: Id;
  status: string;
  service?: string | null;
  customer?: { id: Id; name?: string | null } | null;
  vehicle?: {
    id: Id;
    year?: number;
    make?: string | null;
    model?: string | null;
    plate?: string | null;
    unit_number?: string | null;
  } | null;
  scheduled_at?: string | null;
  eta_start?: string | null;
  eta_end?: string | null;
};

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

export default function DispatchQueueClient() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [sel, setSel] = useState<Set<Id>>(new Set());
  const [error, setError] = useState("");

  // Bulk modal fields
  const [openBulk, setOpenBulk] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [etaStart, setEtaStart] = useState("");
  const [etaEnd, setEtaEnd] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const js = await getJSON<RequestRow[]>("/api/dispatch/queue");
        setRows(js);
      } catch (e: any) {
        setError(e?.message || "Failed to load.");
      }
    })();
  }, []);

  function toggle(id: Id) {
    const next = new Set(sel);
    next.has(id) ? next.delete(id) : next.add(id);
    setSel(next);
  }

  async function applyBulk() {
    setError("");
    try {
      const ids = Array.from(sel);
      await patchJSON("/api/dispatch/bulk-schedule", {
        ids,
        scheduled_at: scheduleAt ? new Date(scheduleAt).toISOString() : null,
        eta_start: etaStart ? new Date(etaStart).toISOString() : null,
        eta_end: etaEnd ? new Date(etaEnd).toISOString() : null,
      });

      alert("Bulk scheduling applied.");
      window.location.reload();
    } catch (e: any) {
      setError(e?.message || "Failed to apply bulk.");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dispatch — Queue</h1>

      <div className="flex gap-3">
        <button
          disabled={sel.size === 0}
          onClick={() => setOpenBulk(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-40"
        >
          Bulk Schedule ({sel.size})
        </button>
        <Link href="/dispatch/scheduled" className="text-blue-600 underline">
          Scheduled Jobs
        </Link>
      </div>

      {error ? (
        <div className="border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        {rows.map((r) => {
          const v = r.vehicle;
          return (
            <div
              key={r.id}
              className="p-4 bg-white border rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={sel.has(r.id)}
                  onChange={() => toggle(r.id)}
                />
                <div>
                  <div className="font-medium text-sm">
                    {v ? `${v.year} ${v.make} ${v.model}` : "Vehicle"}
                  </div>
                  <div className="text-xs text-gray-600">
                    {r.customer?.name || "Customer"} — {r.service || "Service"}
                  </div>
                </div>
              </div>

              <Link
                href={`/dispatch/assign?id=${r.id}`}
                className="text-xs text-blue-600 underline"
              >
                Assign
              </Link>
            </div>
          );
        })}
      </div>

      {/* ========================== */}
      {/* BULK SCHEDULER MODAL       */}
      {/* ========================== */}
      {openBulk && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl">
            <h2 className="text-xl font-semibold">Bulk Scheduler</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium">Scheduled Date/Time</label>
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">ETA Start</label>
                <input
                  type="datetime-local"
                  value={etaStart}
                  onChange={(e) => setEtaStart(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">ETA End</label>
                <input
                  type="datetime-local"
                  value={etaEnd}
                  onChange={(e) => setEtaEnd(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setOpenBulk(false)}
                className="px-4 py-2 border rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={applyBulk}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl"
              >
                Apply to {sel.size} Requests
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
