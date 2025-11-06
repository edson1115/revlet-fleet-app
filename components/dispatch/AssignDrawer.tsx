// components/dispatch/AssignDrawer.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type UUID = string;

type Technician = {
  id: UUID;
  full_name?: string | null;
  label?: string | null;
  name?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  selectedIds: UUID[];
  onAssigned?: () => void; // callback after successful assign
};

async function getJSON<T>(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return (await res.json()) as T;
}

/** Try multiple lookup endpoints to stay compatible with your repo */
async function fetchTechnicians(): Promise<Technician[]> {
  // Attempt 1: /api/techs
  try {
    const a = await getJSON<Technician[]>("/api/techs");
    if (Array.isArray(a)) return a;
  } catch {}
  // Attempt 2: /api/lookups?kind=techs
  try {
    const b = await getJSON<{ techs?: Technician[] }>("/api/lookups?kind=techs");
    if (Array.isArray(b?.techs)) return b.techs!;
  } catch {}
  // Fallback: empty
  return [];
}

export default function AssignDrawer({ open, onClose, selectedIds, onAssigned }: Props) {
  const [techs, setTechs] = useState<Technician[]>([]);
  const [techId, setTechId] = useState<UUID | "">("");
  const [when, setWhen] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default schedule: next day at 10:00 AM (local)
  useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setDate(now.getDate() + 1);
    next.setHours(10, 0, 0, 0);
    // to datetime-local value
    const pad = (n: number) => String(n).padStart(2, "0");
    const v = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}`;
    setWhen(v);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchTechnicians().then(setTechs).catch(() => setTechs([]));
  }, [open]);

  const disabled = useMemo(() => {
    return submitting || !techId || !when || selectedIds.length === 0;
  }, [submitting, techId, when, selectedIds.length]);

  async function handleAssign() {
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        op: "assign",
        ids: selectedIds,
        technician_id: techId,
        scheduled_at: when, // ISO-ish datetime-local string; your API can parse to timestamptz
        note: note?.trim() || null,
      };
      const res = await fetch("/api/requests/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      onAssigned?.();
      onClose();
      setTechId("");
      setNote("");
    } catch (e: any) {
      setError(e?.message || "Failed to assign");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Assign {selectedIds.length} job{selectedIds.length !== 1 ? "s" : ""}</h2>
          <button
            className="rounded-xl border px-3 py-1 hover:bg-gray-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Technician</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={techId}
              onChange={(e) => setTechId(e.target.value as UUID)}
            >
              <option value="">Select technician…</option>
              {techs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label || t.full_name || t.name || t.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date & time</label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border px-3 py-2"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Note (optional)</label>
            <textarea
              className="w-full rounded-lg border px-3 py-2"
              rows={3}
              placeholder="Any scheduling notes…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              className="rounded-lg border px-4 py-2"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50"
              disabled={disabled}
              onClick={handleAssign}
            >
              {submitting ? "Assigning…" : "Assign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
