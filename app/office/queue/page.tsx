'use client';

import { useEffect, useState } from 'react';

type RequestRow = {
  id: string;
  vehicle_id: string;
  service_type: string;
  priority: string;
  fmc: string | null;
  status: string;
  preferred_date_1: string | null;
  created_at: string;
};

type Vehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  unit_number?: string | null;
  plate?: string | null;
};

export default function OfficeQueuePage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [vehicles, setVehicles] = useState<Record<string, Vehicle>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch NEW requests + vehicle labels
  async function load() {
    try {
      setLoading(true);
      setError('');

      // NEW requests
      const rr = await fetch('/api/requests?status=NEW&limit=50', { cache: 'no-store' });
      const rj = await rr.json().catch(() => ({}));
      if (!rr.ok) throw new Error(rj?.error || 'Failed to load requests');
      setRows(rj.requests ?? []);

      // Vehicles
      const vr = await fetch('/api/vehicles', { cache: 'no-store' });
      const vj = await vr.json().catch(() => ({}));
      if (vr.ok) {
        const map: Record<string, Vehicle> = {};
        (vj.vehicles ?? []).forEach((v: Vehicle) => {
          map[v.id] = v;
        });
        setVehicles(map);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function scheduleNow(id: string) {
    setBusy(id);
    setError('');

    const res = await fetch(`/api/requests/${id}/schedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduled_at: new Date().toISOString(),
        note: 'Scheduled from Office queue',
      }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(null);

    if (!res.ok) {
      setError(j?.error || `Failed to schedule (HTTP ${res.status})`);
      return;
    }

    // Remove from NEW queue immediately
    setRows(prev => prev.filter(r => r.id !== id));
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-3 flex items-center gap-2">
          <h1 className="text-2xl font-bold">Office Queue — NEW Requests</h1>
          <button
            onClick={load}
            disabled={loading}
            className="ml-auto px-4 py-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto border rounded bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Created</th>
                <th className="text-left p-2">Vehicle</th>
                <th className="text-left p-2">Service</th>
                <th className="text-left p-2">Priority</th>
                <th className="text-left p-2">Preferred</th>
                <th className="text-left p-2 w-40">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const v = vehicles[r.vehicle_id];
                const vLabel = v
                  ? `${v.unit_number ? v.unit_number + ' — ' : ''}${v.year} ${v.make} ${v.model}${v.plate ? ' (' + v.plate + ')' : ''}`
                  : r.vehicle_id.slice(0, 8) + '…';

                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="p-2">{vLabel}</td>
                    <td className="p-2">{r.service_type}</td>
                    <td className="p-2">{r.priority}</td>
                    <td className="p-2">
                      {r.preferred_date_1 ? new Date(r.preferred_date_1).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-2">
                      <button
                        disabled={busy === r.id}
                        onClick={() => scheduleNow(r.id)}
                        className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                      >
                        {busy === r.id ? 'Scheduling…' : 'Schedule now'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={6}>
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
