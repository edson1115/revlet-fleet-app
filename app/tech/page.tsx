// app/tech/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  status: string;
  created_at?: string;
  scheduled_at?: string | null;
  service?: string | null;
  customer?: { id: string; name?: string | null } | null;
  location?: { id: string; name?: string | null } | null;
  vehicle?: { id: string; unit_number?: string | null; year?: number | null; make?: string | null; model?: string | null } | null;
};

async function getJSON<T>(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json() as Promise<T>;
}
async function postJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json() as Promise<T>;
}
async function patchJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json() as Promise<T>;
}

export default function TechHome() {
  const [techId, setTechId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const [noteId, setNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  async function loadMe() {
    const me = await getJSON<{ technician_id: string | null }>("/api/tech/me");
    setTechId(me.technician_id || null);
  }

  async function refresh() {
    if (!techId) { setRows([]); return; }
    // Ask for SCHEDULED,IN_PROGRESS assigned to me
    const q = new URLSearchParams({
      status: "SCHEDULED,IN_PROGRESS",
      technician_id: techId, // we’ll read this in the API
    });
    const data = await getJSON<{ rows: Row[] }>(`/api/requests?${q.toString()}`);
    setRows(data.rows ?? []);
  }

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        setLoading(true);
        await loadMe();
      } catch (e: any) {
        setErr(e?.message || "Failed to resolve tech.");
      } finally {
        if (m) setLoading(false);
      }
    })();
    return () => { m = false; };
  }, []);

  useEffect(() => {
    let m = true;
    (async () => {
      if (!techId) return;
      try {
        setLoading(true);
        await refresh();
      } catch (e: any) {
        if (m) setErr(e?.message || "Failed to load jobs.");
      } finally {
        if (m) setLoading(false);
      }
    })();
    return () => { m = false; };
  }, [techId]);

  const start = async (id: string) => {
    await postJSON("/api/requests/batch", { op: "status", ids: [id], status: "IN_PROGRESS" });
    await refresh();
  };
  const complete = async (id: string) => {
    await postJSON("/api/requests/batch", { op: "status", ids: [id], status: "COMPLETED" });
    await refresh();
  };

  const openNote = (id: string) => { setNoteId(id); setNoteText(""); };
  const cancelNote = () => { setNoteId(null); setNoteText(""); };
  const saveNote = async () => {
    if (!noteId || !noteText.trim()) { cancelNote(); return; }
    await patchJSON(`/api/requests/${noteId}`, { add_note: noteText.trim() });
    cancelNote();
    await refresh();
  };

  const hasJobs = rows.length > 0;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Jobs</h1>

      {!techId && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 text-yellow-900 p-3 text-sm">
          No technician linked to your account. Ask an admin to link your user to a technician record.
        </div>
      )}

      {err && (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-800 p-3 text-sm">{err}</div>
      )}

      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : !hasJobs ? (
        <div className="text-sm text-gray-500">No assigned jobs.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Vehicle</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Service</th>
                <th className="py-2 pr-4">Scheduled</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const ymk = [r.vehicle?.year, r.vehicle?.make, r.vehicle?.model].filter(Boolean).join(" ");
                const vehicleLabel = r.vehicle?.unit_number ? `${r.vehicle.unit_number}${ymk ? ` — ${ymk}` : ""}` : (ymk || "—");
                const created = r.created_at ? new Date(r.created_at).toLocaleString() : "—";
                const sched = r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : "—";
                return (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 pr-4">{created}</td>
                    <td className="py-2 pr-4">{r.status}</td>
                    <td className="py-2 pr-4">{r.customer?.name || "—"}</td>
                    <td className="py-2 pr-4">{vehicleLabel}</td>
                    <td className="py-2 pr-4">{r.location?.name || "—"}</td>
                    <td className="py-2 pr-4">{r.service || "—"}</td>
                    <td className="py-2 pr-4">{sched}</td>
                    <td className="py-2 pr-4">
                      <div className="flex flex-wrap gap-2">
                        {r.status === "SCHEDULED" && (
                          <button className="px-3 py-1 rounded-md border bg-white" onClick={() => start(r.id)}>
                            Start
                          </button>
                        )}
                        {r.status === "IN_PROGRESS" && (
                          <button className="px-3 py-1 rounded-md border bg-white" onClick={() => complete(r.id)}>
                            Complete
                          </button>
                        )}
                        <button className="px-3 py-1 rounded-md border bg-white" onClick={() => openNote(r.id)}>
                          Add Note
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Note modal */}
      {noteId ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) cancelNote(); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-3">Add Note</h2>
            <textarea className="w-full rounded-lg border p-2 min-h-28" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-3 py-1 rounded-md border" onClick={cancelNote}>Cancel</button>
              <button className="px-3 py-1 rounded-md border bg-black text-white" onClick={saveNote}>Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
