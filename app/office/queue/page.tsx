// app/office/queue/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Id = string;
type Role = 'ADMIN' | 'OFFICE' | 'DISPATCH' | 'TECH' | 'CUSTOMER';
type Status =
  | 'NEW'
  | 'WAITING_APPROVAL'
  | 'WAITING_PARTS'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'CANCELED'
  | 'RESCHEDULED'
  | 'COMPLETED';

type Row = {
  id: Id;
  vehicle_id: Id;
  location_id: Id;
  customer_id: Id;
  service: string;
  status: Status;
  po_number: string | null;
  created_at: string;
};

type Location = { id: Id; name: string };

const STATUS_ALL: Status[] = [
  'NEW','WAITING_APPROVAL','WAITING_PARTS','SCHEDULED','IN_PROGRESS','CANCELED','RESCHEDULED','COMPLETED'
];

export default function OfficeQueuePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [locs, setLocs] = useState<Location[]>([]);
  const [status, setStatus] = useState<'ALL' | Status>('NEW');
  const [market, setMarket] = useState<Id | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [maps, setMaps] = useState<{ vehiclesById: any; locationsById: any; customersById: any }>({
    vehiclesById: {}, locationsById: {}, customersById: {}
  });
  const [role, setRole] = useState<Role>('CUSTOMER');
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [poDraft, setPoDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await fetch('/api/me', { cache: 'no-store' }).then(r => r.json());
        if (!alive) return;
        setRole((me?.role ?? 'CUSTOMER') as Role);
      } catch {}
      try {
        const lookups = await fetch('/api/lookups', { cache: 'no-store' }).then(r => r.json());
        if (!alive) return;
        setLocs(lookups.locations ?? []);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== 'ALL') params.set('status', status);
    if (market !== 'ALL') params.set('location_id', market);
    const json = await fetch(`/api/requests?${params.toString()}`, { cache: 'no-store' }).then(r => r.json());
    setRows(json.rows ?? []);
    setMaps({
      vehiclesById: json.vehiclesById ?? {},
      locationsById: json.locationsById ?? {},
      customersById: json.customersById ?? {},
    });
    setLoading(false);
  }
  useEffect(() => { load(); }, [status, market]);

  const markets = useMemo(() => [{ id: 'ALL', name: 'ALL' as const }, ...locs], [locs]);

  const nextOptionsByRole = (s: Status): Status[] => {
    if (role === 'ADMIN' || role === 'OFFICE') {
      const map: Record<Status, Status[]> = {
        NEW: ['WAITING_APPROVAL','WAITING_PARTS','SCHEDULED'],
        WAITING_APPROVAL: ['WAITING_PARTS','SCHEDULED','CANCELED'],
        WAITING_PARTS: ['SCHEDULED','CANCELED'],
        SCHEDULED: ['IN_PROGRESS','CANCELED','RESCHEDULED'],
        IN_PROGRESS: ['CANCELED','RESCHEDULED','COMPLETED'],
        CANCELED: ['RESCHEDULED'],
        RESCHEDULED: ['SCHEDULED','CANCELED'],
        COMPLETED: [],
      };
      return map[s] ?? [];
    }
    if (role === 'DISPATCH') {
      const map: Record<Status, Status[]> = {
        NEW: [],
        WAITING_APPROVAL: [],
        WAITING_PARTS: [],
        SCHEDULED: ['IN_PROGRESS','CANCELED','RESCHEDULED'],
        IN_PROGRESS: ['CANCELED','RESCHEDULED','COMPLETED'],
        CANCELED: ['RESCHEDULED'],
        RESCHEDULED: ['SCHEDULED','CANCELED'],
        COMPLETED: [],
      };
      return map[s] ?? [];
    }
    if (role === 'TECH') {
      const map: Record<Status, Status[]> = {
        NEW: [],
        WAITING_APPROVAL: [],
        WAITING_PARTS: [],
        SCHEDULED: ['IN_PROGRESS'],
        IN_PROGRESS: ['COMPLETED','CANCELED','RESCHEDULED'],
        CANCELED: [],
        RESCHEDULED: [],
        COMPLETED: [],
      };
      return map[s] ?? [];
    }
    return [];
  };

  async function changeStatus(row: Row, next: Status) {
    setBusy((b) => ({ ...b, [row.id]: true }));
    try {
      const payload: any = { next_status: next };
      if (next === 'SCHEDULED') {
        const po = (poDraft[row.id] ?? row.po_number ?? '').trim();
        if (!po) { alert('PO Number is required to move to SCHEDULED.'); return; }
        payload.po_number = po;
      }
      const res = await fetch(`/api/requests/${row.id}/transition`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const ct = res.headers.get('content-type') || '';
      const j = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok) throw new Error(j?.error || `Transition failed (${res.status})`);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Action failed');
    } finally {
      setBusy((b) => ({ ...b, [row.id]: false }));
    }
  }

  function StatusBadge({ s }: { s: Status }) {
    const map: Record<Status, string> = {
      NEW: 'bg-yellow-100 text-yellow-800',
      WAITING_APPROVAL: 'bg-amber-100 text-amber-800',
      WAITING_PARTS: 'bg-purple-100 text-purple-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
      CANCELED: 'bg-red-100 text-red-800',
      RESCHEDULED: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-green-100 text-green-800',
    };
    return <span className={`px-2 py-0.5 rounded text-xs ${map[s]}`}>{s.replaceAll('_',' ')}</span>;
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Office Queue</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <select value={market} onChange={(e) => setMarket(e.target.value as any)} className="border rounded px-3 py-2">
          {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="border rounded px-3 py-2">
          {['ALL', ...STATUS_ALL].map((s: any) => <option key={s} value={s}>{String(s).replaceAll('_',' ')}</option>)}
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
                <th className="text-left p-2">PO #</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Next</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const v = maps.vehiclesById[r.vehicle_id];
                const c = maps.customersById[r.customer_id];
                const l = maps.locationsById[r.location_id];
                const vLabel = v ? `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}${v.unit_number ? ` — ${v.unit_number}` : ''}`.trim() : r.vehicle_id;
                const nexts = nextOptionsByRole(r.status);
                const working = !!busy[r.id];

                return (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="p-2">{vLabel}</td>
                    <td className="p-2">{c?.name ?? r.customer_id}</td>
                    <td className="p-2">{l?.name ?? r.location_id}</td>
                    <td className="p-2">{r.service}</td>
                    <td className="p-2">
                      {(role === 'ADMIN' || role === 'OFFICE') ? (
                        <input
                          className="border rounded px-2 py-1 w-36"
                          placeholder="PO #"
                          defaultValue={r.po_number ?? ''}
                          onChange={(e) => setPoDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                        />
                      ) : (
                        <span className="font-mono">{r.po_number ?? '—'}</span>
                      )}
                    </td>
                    <td className="p-2"><StatusBadge s={r.status} /></td>
                    <td className="p-2">
                      {nexts.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <select
                          className="border rounded px-2 py-1"
                          disabled={working}
                          onChange={(e) => {
                            const next = e.target.value as Status;
                            if (!next) return;
                            changeStatus(r, next);
                            e.currentTarget.selectedIndex = 0;
                          }}
                        >
                          <option value="">Select…</option>
                          {nexts.map((n) => <option key={n} value={n}>{n.replaceAll('_',' ')}</option>)}
                        </select>
                      )}
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
