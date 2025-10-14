// app/reports/completed/page.tsx
'use client';

import { useEffect, useState } from 'react';

type RangeOpt = 'today' | '7d';

type Vehicle = { id: string; year: number; make: string; model: string; unit_number?: string | null };
type Row = {
  id: string;
  service_type?: string | null;
  completed_at?: string | null;
  odometer_miles?: number | null;
  vehicle?: Vehicle | null;
  location?: { id: string; name: string } | null;
  customer?: { id: string; name: string } | null; // ← new
};

export default function CompletedReportsPage() {
  const [range, setRange] = useState<RangeOpt>('today');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load(r: RangeOpt) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/reports/completed?range=${r}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || `HTTP ${res.status}`);
      setRows(json.rows || []);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(range); }, [range]);

  // CSV helpers
  function toCsv(data: Row[]) {
    const headers = ['Completed', 'Vehicle', 'Unit', 'Service', 'Odometer', 'Location', 'Customer']; // ← add
    const lines = data.map((r) => [
      r.completed_at ? new Date(r.completed_at).toISOString() : '',
      r.vehicle ? `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}` : '',
      r.vehicle?.unit_number ?? '',
      r.service_type ?? '',
      r.odometer_miles ?? '',
      r.location?.name ?? '',
      r.customer?.name ?? '', // ← add
    ]);
    const csv = [headers, ...lines]
      .map((arr) => arr.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  function downloadCsv(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const canExport = !loading && rows.length > 0;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Completed Jobs</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRange('today')}
            className={`px-3 py-1 rounded ${range === 'today' ? 'bg-black text-white' : 'bg-gray-200'}`}
          >
            Today
          </button>
          <button
            onClick={() => setRange('7d')}
            className={`px-3 py-1 rounded ${range === '7d' ? 'bg-black text-white' : 'bg-gray-200'}`}
          >
            Last 7 days
          </button>
          <button
            disabled={!canExport}
            onClick={() => downloadCsv(`completed_${range}_${Date.now()}.csv`, toCsv(rows))}
            className={`px-3 py-1 rounded border ${canExport ? '' : 'opacity-50 cursor-not-allowed'}`}
            title={canExport ? 'Download CSV' : 'Nothing to export'}
          >
            Download CSV
          </button>
        </div>
      </div>

      {err && <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-600">No completed jobs in this range.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Completed</th>
                <th className="pr-4">Vehicle</th>
                <th className="pr-4">Unit</th>
                <th className="pr-4">Service</th>
                <th className="pr-4">Odometer</th>
                <th className="pr-4">Location</th>
                <th className="pr-4">Customer</th> {/* ← new */}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 pr-4">
                    {r.completed_at ? new Date(r.completed_at).toLocaleString() : '—'}
                  </td>
                  <td className="pr-4">
                    {r.vehicle ? `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}` : '—'}
                  </td>
                  <td className="pr-4">{r.vehicle?.unit_number ?? '—'}</td>
                  <td className="pr-4">{r.service_type ?? '—'}</td>
                  <td className="pr-4">{r.odometer_miles ?? '—'}</td>
                  <td className="pr-4">{r.location?.name ?? '—'}</td>
                  <td className="pr-4">{r.customer?.name ?? '—'}</td> {/* ← new */}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-gray-500 mt-2">Total: {rows.length}</div>
        </div>
      )}
    </div>
  );
}
