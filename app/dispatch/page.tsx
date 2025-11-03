'use client';

import { useEffect, useMemo, useState } from 'react';

type Technician = { id: string; label?: string | null; name?: string | null };
type RequestRow = {
  id: string;
  status: string;
  created_at?: string | null;
  scheduled_at?: string | null;
  service?: string | null;
  customer?: { id: string; name?: string | null } | null;
  location?: { id: string; name?: string | null } | null;
  vehicle?: {
    id: string;
    unit_number?: string | null;
    year?: number | null;
    make?: string | null;
    model?: string | null;
  } | null;
  technician?: { id: string | null } | null;
};

async function fetchJSON<T>(url: string) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` – ${text}` : ''}`);
  }
  return res.json() as Promise<T>;
}

async function postJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` – ${text}` : ''}`);
  }
  return res.json() as Promise<T>;
}

/** Next weekday (Mon–Fri) at 04:00 local, formatted for datetime-local input (YYYY-MM-DDTHH:MM) */
function nextWeekday4amLocal(): string {
  const d = new Date();
  // start from tomorrow
  d.setDate(d.getDate() + 1);
  // 0 = Sun, 6 = Sat → push to Monday
  const dow = d.getDay();
  if (dow === 0) d.setDate(d.getDate() + 1); // Sunday → Monday
  if (dow === 6) d.setDate(d.getDate() + 2); // Saturday → Monday
  d.setHours(4, 0, 0, 0);
  // format to YYYY-MM-DDTHH:MM (local)
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function DispatchPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // Scheduling controls
  const [assignTechId, setAssignTechId] = useState<string>('');
  const [reschedAt, setReschedAt] = useState<string>(nextWeekday4amLocal());

  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string>('');
  const [toast, setToast] = useState<string>('');

  // Load technicians (primary: /api/techs; fallback: /api/lookups?scope=technicians)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchJSON<{ rows?: Technician[]; data?: Technician[] }>('/api/techs?active=1');
        const list = (data.rows ?? data.data) ?? [];
        if (mounted) {
          // normalize label
          const normalized = list.map(t => ({ ...t, label: t.label ?? t.name ?? t.id }));
          setTechs(normalized);
        }
      } catch {
        try {
          const fb = await fetchJSON<{ data?: Technician[]; rows?: Technician[] }>('/api/lookups?scope=technicians');
          const list = (fb.rows ?? fb.data) ?? [];
          const normalized = list.map(t => ({ ...t, label: t.label ?? (t as any).name ?? t.id }));
          if (mounted) setTechs(normalized);
        } catch {
          if (mounted) setTechs([]);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load ONLY “WAITING TO BE SCHEDULED”
  async function refresh() {
    const q = new URLSearchParams({ status: 'WAITING TO BE SCHEDULED' });
    const data = await fetchJSON<{ rows: RequestRow[] }>(`/api/requests?${q.toString()}`);
    setRows(data.rows ?? []);
  }

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr('');
    setSelected({});
    (async () => {
      try {
        await refresh();
      } catch (e: any) {
        if (mounted) setErr(e?.message || 'Failed to load requests.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const allChecked = useMemo(() => {
    const ids = rows.map(r => r.id);
    return ids.length > 0 && ids.every(id => selected[id]);
  }, [rows, selected]);

  const anyChecked = useMemo(() => Object.values(selected).some(Boolean), [selected]);

  const techMap = useMemo(() => new Map(techs.map(t => [t.id, t.label ?? t.id])), [techs]);

  function toggleAll() {
    const next: Record<string, boolean> = {};
    if (!allChecked) rows.forEach(r => { next[r.id] = true; });
    setSelected(next);
  }
  function toggleOne(id: string) {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  }

  async function run(op: string, payload: Record<string, any> = {}) {
    const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
    if (ids.length === 0) throw new Error('Select at least one request.');
    await postJSON('/api/requests/batch', { op, ids, ...payload });
  }

  /** One-click schedule: requires a technician + datetime → assign then reschedule with status=SCHEDULED */
  async function scheduleSelected() {
    try {
      setErr('');
      setToast('');
      if (!assignTechId) throw new Error('Pick a technician before scheduling.');
      if (!reschedAt) throw new Error('Pick a date/time before scheduling.');

      const iso = new Date(reschedAt).toISOString();
      // 1) assign tech
      await run('assign', { technician_id: assignTechId });
      // 2) set scheduled_at and flip to SCHEDULED (text-only for others, and moves to Tech view)
      await run('reschedule', { scheduled_at: iso, status: 'SCHEDULED' });

      setToast('Scheduled successfully.');
      setSelected({});
      setReschedAt(nextWeekday4amLocal()); // reset to next business day 4am
      await refresh();
    } catch (e: any) {
      setErr(e?.message || 'Scheduling failed.');
    }
  }

  // Optional helpers still available:
  async function unassignSelected() {
    try {
      setErr(''); setToast('');
      await run('unassign');
      setToast('Unassigned.');
      setSelected({});
      await refresh();
    } catch (e: any) {
      setErr(e?.message || 'Unassign failed.');
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Dispatch</h1>
        <div className="text-sm text-gray-600">Showing: <span className="font-medium">WAITING TO BE SCHEDULED</span></div>
      </div>

      {err ? (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-800 p-3">
          <div className="font-medium">Action failed</div>
          <div className="text-sm opacity-90 mt-1">{err}</div>
        </div>
      ) : null}

      {toast ? (
        <div className="rounded-md border border-green-300 bg-green-50 text-green-800 p-3">
          <div className="text-sm">{toast}</div>
        </div>
      ) : null}

      {/* Primary scheduling controls */}
      <div className="border rounded-xl p-4 space-y-3">
        <div className="font-medium">Assign & Schedule</div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <select
            value={assignTechId}
            onChange={(e) => setAssignTechId(e.target.value)}
            className="border rounded-md px-3 py-2 min-w-56"
            aria-label="Technician"
          >
            <option value="">Select technician…</option>
            {techs.map(t => (
              <option key={t.id} value={t.id}>
                {(t.label ?? t.name ?? t.id) as string}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={reschedAt}
            onChange={(e) => setReschedAt(e.target.value)}
            className="border rounded-md px-3 py-2"
            aria-label="Schedule at"
          />

          <button
            onClick={scheduleSelected}
            disabled={!anyChecked}
            className="px-4 py-2 rounded-md border bg-black text-white disabled:opacity-40"
          >
            Schedule Selected
          </button>

          <button
            onClick={unassignSelected}
            disabled={!anyChecked}
            className="px-4 py-2 rounded-md border bg-white text-black disabled:opacity-40"
          >
            Unassign
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Select rows below → pick a technician → confirm the date/time (defaults to next weekday at 4:00 AM) → “Schedule Selected”.
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="animate-pulse text-sm text-gray-600">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Vehicle</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Service</th>
                <th className="py-2 pr-4">Technician</th>
                <th className="py-2 pr-4">Scheduled</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={8}>No requests.</td>
                </tr>
              ) : rows.map((r) => {
                const ymk = [r.vehicle?.year, r.vehicle?.make, r.vehicle?.model].filter(Boolean).join(' ');
                const vehicleLabel = r.vehicle?.unit_number
                  ? `${r.vehicle.unit_number}${ymk ? ` — ${ymk}` : ''}`
                  : (ymk || '—');
                const techLabel = r.technician?.id ? (techMap.get(r.technician.id) ?? r.technician.id) : '—';
                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4">
                      <input
                        type="checkbox"
                        checked={!!selected[r.id]}
                        onChange={() => toggleOne(r.id)}
                        aria-label={`Select ${r.id}`}
                      />
                    </td>
                    <td className="py-2 pr-4">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                    <td className="py-2 pr-4">{r.customer?.name || '—'}</td>
                    <td className="py-2 pr-4">{vehicleLabel}</td>
                    <td className="py-2 pr-4">{r.location?.name || '—'}</td>
                    <td className="py-2 pr-4">{r.service || '—'}</td>
                    <td className="py-2 pr-4">{techLabel}</td>
                    <td className="py-2 pr-4">{r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
