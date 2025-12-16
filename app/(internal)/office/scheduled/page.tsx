'use client';

import { useEffect, useState } from 'react';

type Row = {
  id: string;
  created_at: string;
  vehicle_display: string; // e.g., "VAN-101 — 2020 Ford Transit 250 (ABC-101)"
  service_type: string;
  priority: string;
  preferred_date_1: string | null;
};

export default function ScheduledPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      // Reuse your existing GET /api/requests?status=...
      const r = await fetch('/api/requests?status=SCHEDULED&limit=50', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setRows(j.requests ?? []);
    } catch (e: any) {
      setError(e.message || 'Failed to load scheduled requests');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function startJob(id: string) {
    setError('');
    try {
      const r = await fetch(`/api/requests/${id}/start`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Dispatch marked as in progress' }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      // Remove the row from this list (no longer scheduled)
      setRows((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e.message || 'Failed to start job');
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Dispatch — Scheduled</h1>

        {error && (
          <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={load}
            className="px-3 py-2 rounded border bg-white hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="text-left px-4 py-2">Created</th>
                <th className="text-left px-4 py-2">Vehicle</th>
                <th className="text-left px-4 py-2">Service</th>
                <th className="text-left px-4 py-2">Priority</th>
                <th className="text-left px-4 py-2">Preferred</th>
                <th className="text-left px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No scheduled requests.
                  </td>
                </tr>
              )}

              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">{r.vehicle_display}</td>
                  <td className="px-4 py-2">{r.service_type}</td>
                  <td className="px-4 py-2">{r.priority}</td>
                  <td className="px-4 py-2">
                    {r.preferred_date_1 ? new Date(r.preferred_date_1).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => startJob(r.id)}
                      className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Mark In Progress
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}



