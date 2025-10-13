// app/tech/queue/page.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { vehicleLabel, type Vehicle } from '@/lib/vehicleLabel';

type ReqRow = {
  id: string;
  vehicle_id: string | null;
  started_at: string | null;
  service_type?: string | null;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | null;
};

const TechQueue: React.FC = () => {
  const [rows, setRows] = useState<ReqRow[]>([]);
  const [vehiclesById, setVehiclesById] = useState<Record<string, Vehicle>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/requests?status=IN_PROGRESS&limit=100', { cache: 'no-store' });
      const ct = res.headers.get('content-type') || '';
      const body = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setRows(body?.rows ?? []);
      setVehiclesById(body?.vehiclesById ?? {});
    } catch (e: any) {
      setErr(e?.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function complete(id: string, odo?: number) {
    setBusy(id);
    setErr(null);
    try {
      const res = await fetch(`/api/requests/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ odometer_miles: odo ?? null }),
      });
      const ct = res.headers.get('content-type') || '';
      const body = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setRows(prev => prev.filter(r => r.id !== id)); // remove from IN_PROGRESS
    } catch (e: any) {
      setErr(e?.message || 'Failed to complete request');
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Tech — In Progress</h1>
          <button
            onClick={load}
            disabled={loading}
            className="ml-auto rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {err && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>}

        <ul className="divide-y rounded-xl border bg-white">
          {rows.map((r) => {
            const v = r.vehicle_id ? vehiclesById[r.vehicle_id] : undefined;
            return (
              <li key={r.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="truncate font-medium">{vehicleLabel(v)}</div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    Req #{r.id}
                    {r.service_type ? ` • ${r.service_type}` : ''}
                    {r.started_at ? ` • Started ${new Date(r.started_at).toLocaleString()}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="Odo"
                    className="w-24 rounded border px-2 py-1"
                    id={`odo-${r.id}`}
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById(`odo-${r.id}`) as HTMLInputElement | null;
                      const n = el?.value ? Number(el.value) : undefined;
                      complete(r.id, Number.isFinite(n as number) ? (n as number) : undefined);
                    }}
                    disabled={busy === r.id}
                    className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {busy === r.id ? 'Completing…' : 'Complete'}
                  </button>
                </div>
              </li>
            );
          })}
          {rows.length === 0 && <li className="p-4 text-sm text-gray-600">No in-progress requests.</li>}
        </ul>
      </div>
    </main>
  );
};

export default TechQueue;
