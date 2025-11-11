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

/**
 * Load technicians in a way that matches the updated API:
 * - Prefer /api/techs?active=1 (can return array or { rows })
 * - Fallback to /api/techs
 * - Fallback to /api/lookups?kind=techs
 */
async function fetchTechnicians(): Promise<Technician[]> {
  // Try /api/techs?active=1
  try {
    const res = await getJSON<any>("/api/techs?active=1");
    const rows: Technician[] = Array.isArray(res)
      ? res
      : Array.isArray(res?.rows)
      ? res.rows
      : [];
    if (rows.length) return rows;
  } catch {
    // ignore
  }

  // Try plain /api/techs
  try {
    const res = await getJSON<any>("/api/techs");
    const rows: Technician[] = Array.isArray(res)
      ? res
      : Array.isArray(res?.rows)
      ? res.rows
      : [];
    if (rows.length) return rows;
  } catch {
    // ignore
  }

  // Try /api/lookups?kind=techs
  try {
    const res = await getJSON<any>("/api/lookups?kind=techs");
    const rows: Technician[] = Array.isArray(res?.techs) ? res.techs : [];
    if (rows.length) return rows;
  } catch {
    // ignore
  }

  return [];
}

/** Convert <input type="datetime-local"> to ISO string (or null) */
function toIsoFromLocal(val: string): string | null {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Default schedule: next day at 10:00 AM local, formatted for datetime-local */
function defaultNextDayAt10() {
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + 1);
  next.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}` +
    `T${pad(next.getHours())}:${pad(next.getMinutes())}`
  );
}

export default function AssignDrawer({
  open,
  onClose,
  selectedIds,
  onAssigned,
}: Props) {
  const [techs, setTechs] = useState<Technician[]>([]);
  const [techId, setTechId] = useState<UUID | "">("");
  const [when, setWhen] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset defaults whenever the drawer opens
  useEffect(() => {
    if (!open) return;
    setError(null);
    setNote("");
    setTechId("");
    setWhen(defaultNextDayAt10());
  }, [open]);

  // Load technicians on open
  useEffect(() => {
    if (!open) return;
    fetchTechnicians()
      .then((list) => setTechs(list || []))
      .catch(() => setTechs([]));
  }, [open]);

  const disabled = useMemo(
    () =>
      submitting ||
      !techId ||
      !when ||
      !selectedIds.length,
    [submitting, techId, when, selectedIds.length]
  );

  async function handleAssign() {
    if (disabled) return;
    setSubmitting(true);
    setError(null);

    try {
      const iso = toIsoFromLocal(when);
      if (!iso) {
        throw new Error("Please choose a valid date & time.");
      }

      // 1) Assign technician (per /api/requests/batch op:"assign")
      {
        const res = await fetch("/api/requests/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            op: "assign",
            ids: selectedIds,
            technician_id: techId,
          }),
        });
        if (!res.ok) {
          throw new Error(await res.text().catch(() => "Failed to assign technician"));
        }
      }

      // 2) Set scheduled_at + status:SCHEDULED (per op:"reschedule")
      {
        const res = await fetch("/api/requests/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            op: "reschedule",
            ids: selectedIds,
            scheduled_at: iso,
            status: "SCHEDULED",
            note: note?.trim() || null,
          }),
        });
        if (!res.ok) {
          throw new Error(await res.text().catch(() => "Failed to set schedule"));
        }
      }

      onAssigned?.();
      onClose();
      setTechId("");
      setNote("");
    } catch (e: any) {
      setError(e?.message || "Failed to assign jobs");
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
          <h2 className="text-xl font-semibold">
            Assign {selectedIds.length} job{selectedIds.length !== 1 ? "s" : ""}
          </h2>
          <button
            className="rounded-xl border px-3 py-1 hover:bg-gray-50"
            onClick={onClose}
            disabled={submitting}
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
            <label className="block text-sm font-medium mb-1">Date &amp; time</label>
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

          {error && <p className="text-sm text-red-600">{error}</p>}

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
