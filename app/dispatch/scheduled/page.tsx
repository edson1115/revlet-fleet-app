// app/dispatch/scheduled/page.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { vehicleLabel, type Vehicle } from '@/lib/vehicleLabel';

type ReqRow = {
  id: string;
  vehicle_id: string | null;
  scheduled_at: string | null;
  service_type?: string | null;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | null;
};

const ScheduledPage: React.FC = () => {
  const [rows, setRows] = useState<ReqRow[]>([]);
  const [vehiclesById, setVehiclesById] = useState<Record<string, Vehicle>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/requests?status=SCHEDULED&limit=100', { cache: 'no-store' });
      const ct = res.headers.get('content-type') || '';
      const body = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setRows(body?.rows ?? []);
      setVehiclesById(body?.vehiclesById ?? {});
    } catch (e: any) {
      setErr(e?.message || 'Failed to load scheduled');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function startNow(id: string) {
    setBusy(id);
    setErr(null);
    try {
      const res = await fetch(`/api/requests/${id}/start`, { method: 'PATCH' });
      const ct = res.headers.get('content-type') || '';
      const body = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      // remove from SCHEDULED
      setRows(prev => prev.filter(r => r.id !== id));
    } catch (e: any) {
      setErr(e?.message || 'Failed to start request');
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Dispatch - Scheduled</h1>
          <button
            onClick={load}
            disabled={loading}
            className="ml-auto rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {err && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
            {err}
          </div>
        )}

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
                    {r.priority ? ` • ${r.priority}` : ''}
                    {r.scheduled_at ? ` • ${new Date(r.scheduled_at).toLocaleString()}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => startNow(r.id)}
                  disabled={busy === r.id}
                  className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy === r.id ? 'Starting…' : 'Mark In Progress'}
                </button>
              </li>
            );
          })}
          {rows.length === 0 && (
            <li className="p-4 text-sm text-gray-600">Nothing scheduled.</li>
          )}
        </ul>
      </div>
    </main>
  );
};

export default ScheduledPage;

