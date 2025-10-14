// app/dispatch/scheduled/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type RequestRow = {
  id: string;
  vehicle_id: string | null;
  customer_id: string | null;
  service_type?: string | null;
  scheduled_at?: string | null;
};

type VehicleLite = { id: string; year: number; make: string; model: string; unit_number?: string | null };
type CustomerLite = { id: string; name: string };

type RequestsResponse = {
  rows: RequestRow[];
  vehiclesById: Record<string, VehicleLite | undefined>;
  customersById: Record<string, CustomerLite | undefined>;
};

async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null;
  try { return await res.json(); } catch { return null; }
}

function formatVehicle(v?: VehicleLite | null) {
  if (!v) return '—';
  const unit = v.unit_number ? ` (${v.unit_number})` : '';
  return `${v.year} ${v.make} ${v.model}${unit}`;
}

export default function DispatchScheduledPage() {
  const router = useRouter();
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [vehiclesById, setVehiclesById] = useState<Record<string, VehicleLite | undefined>>({});
  const [customersById, setCustomersById] = useState<Record<string, CustomerLite | undefined>>({});
  const [techs, setTechs] = useState<Array<{ id: string; name: string }>>([]);
  const [techSel, setTechSel] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);

      const [reqRes, lkRes] = await Promise.all([
        fetch('/api/requests?status=SCHEDULED', { cache: 'no-store' }),
        fetch('/api/lookups', { cache: 'no-store' }),
      ]);

      if (!reqRes.ok) {
        setError(`Failed to load scheduled requests (${reqRes.status})`);
        setLoading(false);
        return;
      }

      const data = (await safeJson(reqRes)) as RequestsResponse | null;
      const lks = await safeJson(lkRes);

      if (!data) {
        setError('Invalid response from /api/requests');
        setLoading(false);
        return;
      }
      if (!alive) return;

      setRows(data.rows || []);
      setVehiclesById(data.vehiclesById || {});
      setCustomersById(data.customersById || {});
      setTechs(lks?.techs || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const view = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        vehicleLabel: r.vehicle_id ? formatVehicle(vehiclesById[r.vehicle_id]) : '—',
        customerLabel: r.customer_id ? (customersById[r.customer_id]?.name ?? '—') : '—',
        when: r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : '—',
      })),
    [rows, vehiclesById, customersById]
  );

  async function onAssign(id: string) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/requests/${id}/assign`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        assigned_tech_id: techSel[id] || null,
        dispatch_notes: note[id] || null,
        scheduled_at: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      router.replace('/dispatch/scheduled?scheduled=1');
    } else {
      const j = await safeJson(res);
      setError(j?.error || `Failed to assign (${res.status})`);
      setBusyId(null);
    }
  }

  async function onStart(id: string) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/requests/${id}/start`, { method: 'PATCH' });
    if (res.ok) {
      router.replace('/tech/queue?started=1');
    } else {
      const body = await safeJson(res);
      setError(body?.error || `Failed to start request (${res.status})`);
      setBusyId(null);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Scheduled</h1>
        <span className="text-sm text-gray-500">{loading ? 'Loading…' : `${rows.length} items`}</span>
      </div>

      {error && <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}

      {loading ? (
        <div className="text-sm text-gray-600">Fetching scheduled jobs…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-600">No scheduled jobs.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Vehicle</th>
                <th className="pr-4">Customer</th>
                <th className="pr-4">Service</th>
                <th className="pr-4">Scheduled At</th>
                <th className="pr-4">Assign / Notes</th>
                <th className="w-[1%]"></th>
              </tr>
            </thead>
            <tbody>
              {view.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 pr-4">{r.vehicleLabel}</td>
                  <td className="pr-4">{r.customerLabel}</td>
                  <td className="pr-4">{r.service_type ?? '—'}</td>
                  <td className="pr-4">{r.when}</td>
                  <td className="py-2">
                    <div className="flex flex-col gap-2 min-w-[260px]">
                      <select
                        value={techSel[r.id] ?? ''}
                        onChange={(e) => setTechSel((m) => ({ ...m, [r.id]: e.target.value }))}
                        className="border rounded px-2 py-1"
                      >
                        <option value="">Assign tech…</option>
                        {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <textarea
                        rows={2}
                        placeholder="Notes to tech (parts, location, etc.)"
                        className="border rounded px-2 py-1"
                        value={note[r.id] ?? ''}
                        onChange={(e) => setNote((m) => ({ ...m, [r.id]: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => onAssign(r.id)}
                          disabled={busyId === r.id}
                          className="px-3 py-1 rounded border"
                        >
                          Save assignment
                        </button>
                        <button
                          onClick={() => onStart(r.id)}
                          disabled={busyId === r.id}
                          className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
                        >
                          {busyId === r.id ? 'Starting…' : 'Mark In Progress'}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-2"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
