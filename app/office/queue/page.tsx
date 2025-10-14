// app/office/queue/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type RequestRow = {
  id: string;
  created_at?: string | null;
  service_type?: string | null;
  vehicle_id: string | null;
  customer_id: string | null;
  status?: string | null;
};

type VehicleLite = { id: string; year: number; make: string; model: string; unit_number?: string | null };
type CustomerLite = { id: string; name: string };

type RequestsResponse = {
  rows: RequestRow[];
  vehiclesById: Record<string, VehicleLite | undefined>;
  customersById: Record<string, CustomerLite | undefined>;
};

function formatVehicle(v?: VehicleLite | null) {
  if (!v) return '—';
  const unit = v.unit_number ? ` (${v.unit_number})` : '';
  return `${v.year} ${v.make} ${v.model}${unit}`;
}

async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null;
  try { return await res.json(); } catch { return null; }
}

export default function OfficeQueuePage() {
  const router = useRouter();

  const [rows, setRows] = useState<RequestRow[]>([]);
  const [vehiclesById, setVehiclesById] = useState<Record<string, VehicleLite | undefined>>({});
  const [customersById, setCustomersById] = useState<Record<string, CustomerLite | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // per-row inputs
  const [po, setPo] = useState<Record<string, string>>({});
  const [st, setSt] = useState<Record<string, string>>({});
  const [bypass, setBypass] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/requests?status=NEW', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = (await safeJson(res)) as RequestsResponse | null;
      if (!j) throw new Error('Invalid response from /api/requests');
      setRows(j.rows || []);
      setVehiclesById(j.vehiclesById || {});
      setCustomersById(j.customersById || {});
    } catch (e: any) {
      setErr(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const view = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        createdWhen: r.created_at ? new Date(r.created_at).toLocaleString() : '—',
        vehicleLabel: r.vehicle_id ? formatVehicle(vehiclesById[r.vehicle_id]) : '—',
        customerLabel: r.customer_id ? (customersById[r.customer_id]?.name ?? '—') : '—',
        currentStatus: r.status ?? 'NEW',
      })),
    [rows, vehiclesById, customersById]
  );

  function setField(id: string, key: 'po' | 'st' | 'bypass', val: string | boolean) {
    if (key === 'po') setPo((m) => ({ ...m, [id]: String(val) }));
    if (key === 'st') setSt((m) => ({ ...m, [id]: String(val) }));
    if (key === 'bypass') setBypass((m) => ({ ...m, [id]: Boolean(val) }));
  }

  // Save changes + route flow
  async function saveOffice(id: string) {
    setBusyId(id);
    setErr(null);

    // 1) Update PO + status
    const upd = await fetch(`/api/requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: st[id] || 'NEW', po_number: po[id] || null }),
    });
    if (!upd.ok) {
      const b = await safeJson(upd);
      setErr(b?.error || `Failed to update (${upd.status})`);
      setBusyId(null);
      return;
    }

    // 2) Route: bypass dispatch -> start; else schedule
    if (bypass[id]) {
      const startRes = await fetch(`/api/requests/${id}/start`, { method: 'PATCH' });
      if (!startRes.ok) {
        const b = await safeJson(startRes);
        setErr(b?.error || `Failed to start (${startRes.status})`);
        setBusyId(null);
        return;
      }
      router.replace('/tech/queue?started=1');
    } else {
      const sch = await fetch(`/api/requests/${id}/schedule`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scheduled_at: new Date().toISOString() }),
      });
      if (!sch.ok) {
        const b = await safeJson(sch);
        setErr(b?.error || `Failed to schedule (${sch.status})`);
        setBusyId(null);
        return;
      }
      router.replace('/dispatch/scheduled?scheduled=1');
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Office Queue — NEW Requests</h1>
        <button onClick={load} className="px-3 py-1 rounded border hover:bg-gray-50" disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {err && <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm mb-3">{err}</div>}

      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Created</th>
                <th className="pr-4">Vehicle</th>
                <th className="pr-4">Customer</th>
                <th className="pr-4">Service</th>
                <th className="pr-4">PO</th>
                <th className="pr-4">Status</th>
                <th className="pr-4">Bypass</th>
                <th className="w-[1%]"></th>
              </tr>
            </thead>
            <tbody>
              {view.length === 0 ? (
                <tr>
                  <td className="py-6 text-gray-600" colSpan={8}>No NEW requests.</td>
                </tr>
              ) : (
                view.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 pr-4">{r.createdWhen}</td>
                    <td className="pr-4">{r.vehicleLabel}</td>
                    <td className="pr-4">{r.customerLabel}</td>
                    <td className="pr-4">{r.service_type ?? '—'}</td>

                    <td className="pr-4">
                      <input
                        value={po[r.id] ?? ''}
                        onChange={(e) => setField(r.id, 'po', e.target.value)}
                        placeholder="PO #"
                        className="w-28 border rounded px-2 py-1"
                      />
                    </td>

                    <td className="pr-4">
                      <select
                        value={st[r.id] ?? r.currentStatus}
                        onChange={(e) => setField(r.id, 'st', e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="NEW">NEW</option>
                        <option value="WAITING_APPROVAL">WAITING_APPROVAL</option>
                        <option value="WAITING_PARTS">WAITING_PARTS</option>
                        <option value="CANCELED">CANCELED</option>
                      </select>
                    </td>

                    <td className="pr-4">
                      <label className="text-sm flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!bypass[r.id]}
                          onChange={(e) => setField(r.id, 'bypass', e.target.checked)}
                        />
                        Bypass Dispatch
                      </label>
                    </td>

                    <td className="py-2">
                      <button
                        onClick={() => saveOffice(r.id)}
                        disabled={busyId === r.id}
                        className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
                      >
                        {busyId === r.id ? 'Saving…' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
