// app/office/queue/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Id = string;
type Role = 'ADMIN' | 'OFFICE' | 'DISPATCH' | 'TECH' | 'CUSTOMER';

type Row = {
  id: Id;
  vehicle_id: Id;
  location_id: Id;
  customer_id: Id;
  service: string;
  status: 'NEW' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'INCOMPLETE';
  created_at: string;
};
type Location = { id: Id; name: string };

const STATUS_OPTS = ['ALL','NEW','SCHEDULED','IN_PROGRESS','COMPLETED','CLOSED','INCOMPLETE'] as const;

export default function OfficeQueuePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [locs, setLocs] = useState<Location[]>([]);
  const [status, setStatus] = useState<typeof STATUS_OPTS[number]>('NEW');
  const [market, setMarket] = useState<Id | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [maps, setMaps] = useState<{ vehiclesById: any; locationsById: any; customersById: any }>({
    vehiclesById: {}, locationsById: {}, customersById: {}
  });
  const [role, setRole] = useState<Role>('CUSTOMER');
  const [busy, setBusy] = useState<Record<string, boolean>>({}); // rowId→isWorking

  // who am i + markets for toggle
  useEffect(() => {
    let alive = true;
    (async () => {
      // role
      try {
        const me = await fetch('/api/me', { cache: 'no-store' }).then(r => r.json());
        if (!alive) return;
        setRole((me?.role ?? 'CUSTOMER') as Role);
      } catch {}
      // markets (locations)
      try {
        const lookups = await fetch('/api/lookups', { cache: 'no-store' }).then(r => r.json());
        if (!alive) return;
        setLocs(lookups.locations ?? []);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  // load queue with filters
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (status && status !== 'ALL') params.set('status', status);
      if (market && market !== 'ALL') params.set('location_id', market);
      const res = await fetch(`/api/requests?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!alive) return;
      setRows(json.rows ?? []);
      setMaps({
        vehiclesById: json.vehiclesById ?? {},
        locationsById: json.locationsById ?? {},
        customersById: json.customersById ?? {},
      });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [status, market]);

  const markets = useMemo(() => [{ id: 'ALL', name: 'ALL' as const }, ...locs], [locs]);

  // ----- RBAC action rules -----
  const canSchedule = (r: Row) =>
    (role === 'ADMIN' || role === 'OFFICE' || role === 'DISPATCH') && r.status === 'NEW';

  const canStart = (r: Row) =>
    (role === 'ADMIN' || role === 'DISPATCH' || role === 'TECH') && r.status === 'SCHEDULED';

  const canComplete = (r: Row) =>
    (role === 'ADMIN' || role === 'TECH') && r.status === 'IN_PROGRESS';

  // ----- actions -----
  async function callAndRefresh(rowId: Id, path: 'schedule'|'start'|'complete') {
    setBusy((b) => ({ ...b, [rowId]: true }));
    try {
      const res = await fetch(`/api/requests/${rowId}/${path}`, { method: 'PATCH' });
      if (!res.ok) {
        const ct = res.headers.get('content-type') || '';
        const j = ct.includes('application/json') ? await res.json() : null;
        throw new Error(j?.error || `${path} failed (${res.status})`);
      }
      // refresh list
      const params = new URLSearchParams();
      if (status && status !== 'ALL') params.set('status', status);
      if (market && market !== 'ALL') params.set('location_id', market);
      const fresh = await fetch(`/api/requests?${params.toString()}`, { cache: 'no-store' }).then(r => r.json());
      setRows(fresh.rows ?? []);
      setMaps({
        vehiclesById: fresh.vehiclesById ?? {},
        locationsById: fresh.locationsById ?? {},
        customersById: fresh.customersById ?? {},
      });
    } catch (e: any) {
      alert(e?.message || 'Action failed');
    } finally {
      setBusy((b) => ({ ...b, [rowId]: false }));
    }
  }

  function StatusBadge({ s }: { s: Row['status'] }) {
    const map: Record<Row['status'], string> = {
      NEW: 'bg-yellow-100 text-yellow-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-200 text-gray-800',
      INCOMPLETE: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-0.5 rounded text-xs ${map[s]}`}>{s.replace('_',' ')}</span>;
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Office Queue</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {/* Market toggle (Admin/Office see it; others can too if you prefer) */}
        <select
          value={market}
          onChange={(e) => setMarket(e.target.value as any)}
          className="border rounded px-3 py-2"
        >
          {markets.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Status toggle */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="border rounded px-3 py-2"
        >
          {STATUS_OPTS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_',' ')}
            </option>
          ))}
        </select>

        <div className="ml-auto text-sm text-gray-500">Role: {role}</div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No requests found.</p>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Created</th>
                <th className="text-left p-2">Vehicle</th>
                <th className="text-left p-2">Customer</th>
                <th className="text-left p-2">Market</th>
                <th className="text-left p-2">Service</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const v = maps.vehiclesById[r.vehicle_id];
                const c = maps.customersById[r.customer_id];
                const l = maps.locationsById[r.location_id];

                const vLabel = v
                  ? `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}${v.unit_number ? ` — ${v.unit_number}` : ''}`.trim()
                  : r.vehicle_id;

                const working = !!busy[r.id];

                return (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="p-2">{vLabel}</td>
                    <td className="p-2">{c?.name ?? r.customer_id}</td>
                    <td className="p-2">{l?.name ?? r.location_id}</td>
                    <td className="p-2">{r.service}</td>
                    <td className="p-2"><StatusBadge s={r.status} /></td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-2">
                        {canSchedule(r) && (
                          <button
                            disabled={working}
                            onClick={() => callAndRefresh(r.id, 'schedule')}
                            className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                          >
                            {working ? 'Working…' : 'Schedule'}
                          </button>
                        )}
                        {canStart(r) && (
                          <button
                            disabled={working}
                            onClick={() => callAndRefresh(r.id, 'start')}
                            className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-50"
                          >
                            {working ? 'Working…' : 'Start'}
                          </button>
                        )}
                        {canComplete(r) && (
                          <button
                            disabled={working}
                            onClick={() => callAndRefresh(r.id, 'complete')}
                            className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-50"
                          >
                            {working ? 'Working…' : 'Complete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}



