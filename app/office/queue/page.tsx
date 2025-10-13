// app/office/queue/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { vehicleLabel, type Vehicle as VehicleType } from '@/lib/vehicleLabel';

type RequestRow = {
  id: string;
  vehicle_id: string | null;
  service_type: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | null;
  fmc: string | null;
  status: 'NEW' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  preferred_date_1: string | null;
  created_at: string; // ISO string
};

export default function OfficeQueuePage() {
  const router = useRouter();

  const [rows, setRows] = useState<RequestRow[]>([]);
  const [vehiclesById, setVehiclesById] = useState<Record<string, VehicleType>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/requests?status=NEW&limit=100', { cache: 'no-store' });
      const ct = res.headers.get('content-type') || '';
      const body = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setRows(body?.rows ?? []);
      setVehiclesById(body?.vehiclesById ?? {});
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function scheduleNow(id: string) {
    setBusy(id);
    setErr(null);
    try {
      const res = await fetch(`/api/requests/${id}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_at: new Date().toISOString(),
          note: 'Scheduled from Office queue',
        }),
      });
      const ct = res.headers.get('content-type') || '';
      const j = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);

      // Remove from NEW list immediately
      setRows(prev => prev.filter(r => r.id !== id));

      // Navigate to Dispatch — Scheduled
      router.push('/dispatch/scheduled');
    } catch (e: any) {
      setErr(e?.message || 'Failed to schedule request');
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex items-center gap-2">
          <h1 className="text-2xl font-bold">Office Queue — NEW Requests</h1>
          <button
            onClick={load}
            disabled={loading}
            className="ml-auto rounded border bg-white px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {err && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
            {err}
          </div>
        )}

        <div className="overflow-x-auto rounded border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Created</th>
                <th className="p-2 text-left">Vehicle</th>
                <th className="p-2 text-left">Service</th>
                <th className="p-2 text-left">Priority</th>
                <th className="p-2 text-left">Preferred</th>
                <th className="w-40 p-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const v = r.vehicle_id ? vehiclesById[r.vehicle_id] : undefined;
                const fallback = r.vehicle_id ? `${r.vehicle_id.slice(0, 8)}…` : '—';
                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="p-2">{vehicleLabel(v) || fallback}</td>
                    <td className="p-2">{r.service_type ?? '—'}</td>
                    <td className="p-2">{r.priority ?? 'NORMAL'}</td>
                    <td className="p-2">
                      {r.preferred_date_1
                        ? new Date(r.preferred_date_1).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="p-2">
                      <button
                        disabled={busy === r.id}
                        onClick={() => scheduleNow(r.id)}
                        className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {busy === r.id ? 'Scheduling…' : 'Schedule now'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-gray-500">
                    No NEW requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
