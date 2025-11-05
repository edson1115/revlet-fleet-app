// components/RequestDrawer.tsx
"use client";

import { useEffect, useState } from "react";

type Note = { id: string; text: string; created_at?: string | null };
type Req = {
  id: string;
  status: string;
  service?: string | null;
  fmc?: string | null;
  po?: string | null;
  scheduled_at?: string | null;
  customer?: { id: string; name?: string | null } | null;
  vehicle?: { id: string; unit_number?: string | null; year?: number | null; make?: string | null; model?: string | null } | null;
  location?: { id: string; name?: string | null } | null;
  technician?: { id: string | null; name?: string | null } | null;
  notes_list?: Note[] | null;
};

async function getJSON<T>(url: string) {
  const res = await fetch(url, { credentials: "include" });
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
  const json = await res.json().catch(() => ({}));
  if (!res.ok || (json && (json.ok === false || json.error))) {
    throw new Error(json?.error || json?.detail || "Update failed");
  }
  return json as T;
}

export default function RequestDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const [row, setRow] = useState<Req | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");
  const [noteText, setNoteText] = useState("");

  const refresh = async () => {
    setErr("");
    const data = await getJSON<Req>(`/api/requests/${id}`);
    setRow(data);
  };

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (e: any) {
        if (m) setErr(e?.message || "Failed to load request");
      } finally {
        if (m) setLoading(false);
      }
    })();
    return () => { m = false; };
  }, [id]);

  const addNote = async () => {
    if (!noteText.trim()) return;
    await patchJSON(`/api/requests/${id}`, { add_note: noteText.trim() });
    setNoteText("");
    await refresh(); // ← instantly see the new note
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute right-0 top-0 h-full w-[560px] bg-white shadow-xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Request</h2>
          <button className="px-3 py-1 rounded-md border" onClick={onClose}>Close</button>
        </div>

        {err && <div className="rounded-md border border-red-300 bg-red-50 text-red-800 p-3 text-sm">{err}</div>}

        {loading || !row ? (
          <div className="text-sm text-gray-600">Loading…</div>
        ) : (
          <>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Status:</span> {row.status}</div>
              <div><span className="font-medium">Customer:</span> {row.customer?.name || "—"}</div>
              <div><span className="font-medium">Vehicle:</span> {row.vehicle?.unit_number || "—"}</div>
              <div><span className="font-medium">Location:</span> {row.location?.name || "—"}</div>
              <div><span className="font-medium">Service:</span> {row.service || "—"}</div>
              <div><span className="font-medium">Scheduled:</span> {row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : "—"}</div>
              <div><span className="font-medium">Technician:</span> {row.technician?.name || row.technician?.id || "—"}</div>
            </div>

            <hr className="my-4" />

            <div>
              <div className="font-semibold mb-2">Notes</div>
              <div className="space-y-2 mb-3">
                {(row.notes_list ?? []).length === 0 ? (
                  <div className="text-sm text-gray-500">No notes</div>
                ) : (row.notes_list ?? []).map((n) => (
                  <div key={n.id} className="p-2 border rounded-md">
                    <div className="text-xs text-gray-500">{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</div>
                    <div className="text-sm whitespace-pre-wrap">{n.text}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <textarea
                  className="flex-1 rounded-md border p-2 min-h-20"
                  placeholder="Add a note…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <button className="px-3 py-2 rounded-md border bg-black text-white h-fit" onClick={addNote}>
                  Add
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
