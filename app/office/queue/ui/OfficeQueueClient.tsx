// app/office/queue/ui/OfficeQueueClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UI_STATUSES, type UiStatus } from "@/lib/status";

type Id = string;

type Row = {
  id: Id;
  status: UiStatus | string;
  created_at: string;
  scheduled_at?: string | null;
  service?: string | null;
  po?: string | null;
  notes?: string | null;
  customer?: { name?: string | null; market?: string | null } | null;
  vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    plate?: string | null;
    unit_number?: string | null;
  } | null;
};

const ACTIVE_STATUSES: UiStatus[] = UI_STATUSES.filter(s => s !== "COMPLETED") as UiStatus[];

function vehLabel(r: Row) {
  const v = r.vehicle || {};
  return [v.year, v.make, v.model, v.plate || v.unit_number].filter(Boolean).join(" ");
}

async function getJSON<T>(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

async function patchJSON(url: string, body?: any) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res;
}

export default function OfficeQueueClient({ initialStatus }: { initialStatus?: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");
  const [filter, setFilter] = useState<UiStatus | "ALL">(
    (ACTIVE_STATUSES as string[]).includes(initialStatus || "") ? (initialStatus as UiStatus) : "ALL"
  );
  const [savingId, setSavingId] = useState<Id | null>(null);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const list = await getJSON<Row[] | { rows: Row[] }>("/api/requests");
      const arr: Row[] = Array.isArray(list) ? list : (list as any).rows ?? [];
      arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRows(arr);
    } catch (e: any) {
      setErr(e?.message || "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const actives = rows.filter((r) => r.status !== "COMPLETED");
    if (filter === "ALL") return actives;
    return actives.filter((r) => r.status === filter);
  }, [rows, filter]);

  async function savePO(r: Row, po: string | null) {
    setSavingId(r.id);
    setErr("");
    try {
      await patchJSON(`/api/requests/${r.id}`, { po });
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to save PO.");
    } finally {
      setSavingId(null);
    }
  }

  async function saveNotes(r: Row, notes: string | null) {
    setSavingId(r.id);
    setErr("");
    try {
      await patchJSON(`/api/requests/${r.id}`, { notes });
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to save notes.");
    } finally {
      setSavingId(null);
    }
  }

  async function changeStatus(r: Row, next: UiStatus) {
    setSavingId(r.id);
    setErr("");
    try {
      await patchJSON(`/api/requests/${r.id}`, { status: next });
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to update status.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Completed items are hidden here. See{" "}
          <Link className="text-blue-600 underline" href="/reports/completed">
            Reports → Completed
          </Link>
          .
        </div>
        <div className="flex items-center gap-3">
          <Link className="text-blue-600 underline text-sm" href="/">
            Dashboard
          </Link>
        </div>
      </div>

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
      ) : null}

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 text-sm">
        <button
          className={`px-2 py-1 border rounded ${filter === "ALL" ? "bg-black text-white" : ""}`}
          onClick={() => setFilter("ALL")}
        >
          ALL (active)
        </button>
        {ACTIVE_STATUSES.map((s) => (
          <button
            key={s}
            className={`px-2 py-1 border rounded ${filter === s ? "bg-black text-white" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">PO</th>
              <th className="text-left p-3">Notes</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  No requests.
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-3">
                    <div>{new Date(r.created_at).toLocaleString()}</div>
                    {r.scheduled_at ? (
                      <div className="text-xs text-gray-500">
                        Scheduled {new Date(r.scheduled_at).toLocaleString()}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3">{r.customer?.name ?? "—"}</td>
                  <td className="p-3">{vehLabel(r) || "—"}</td>
                  <td className="p-3">{r.service ?? "—"}</td>
                  <td className="p-3">
                    <input
                      defaultValue={r.po ?? ""}
                      onBlur={async (e) => {
                        const v = e.currentTarget.value.trim();
                        if (v !== (r.po ?? "")) await savePO(r, v || null);
                      }}
                      className="w-40 rounded border px-2 py-1"
                      placeholder="PO"
                      disabled={savingId === r.id}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      defaultValue={r.notes ?? ""}
                      onBlur={async (e) => {
                        const v = e.currentTarget.value.trim();
                        if (v !== (r.notes ?? "")) await saveNotes(r, v || null);
                      }}
                      className="w-72 rounded border px-2 py-1"
                      placeholder="Notes"
                      disabled={savingId === r.id}
                    />
                  </td>
                  <td className="p-3">
                    <select
                      className="rounded border px-2 py-1"
                      defaultValue=""
                      onChange={async (e) => {
                        const v = e.currentTarget.value as UiStatus;
                        if (!v) return;
                        await changeStatus(r, v);
                        e.currentTarget.value = "";
                      }}
                      disabled={savingId === r.id}
                    >
                      <option value="" disabled>Change to…</option>
                      {UI_STATUSES.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <span className="text-xs text-gray-400">—</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
