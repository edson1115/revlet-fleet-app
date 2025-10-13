'use client';
import { useEffect, useState } from 'react';

type Req = {
  id: string;
  created_at: string;
  vehicle_id: string | null;
  service_type: string;
  priority: string;
  preferred_date_1: string | null;
};

type Vehicle = {
  id: string;
  unit_number?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  plate?: string | null;
};

export default function TechQueueInProgressPage() {
  const [rows, setRows] = useState<Req[]>([]);
  const [vehiclesById, setVehiclesById] = useState<Record<string, Vehicle>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError('');

      // 1) Get IN_PROGRESS requests
      const res = await fetch('/api/requests?status=IN_PROGRESS&limit=50', { cache: 'no-store' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Failed to load');

      setRows(j.requests ?? []);

      // 2) Vehicle labels: use API-provided map or fall back to /api/vehicles
      if (j.vehiclesById && typeof j.vehiclesById === 'object') {
        setVehiclesById(j.vehiclesById);
      } else {
        const vr = await fetch('/api/vehicles', { cache: 'no-store' });
        const vj = await vr.json().catch(() => ({}));
        if (vr.ok && Array.isArray(vj.vehicles)) {
          const map: Record<string, Vehicle> = {};
          vj.vehicles.forEach((v: Vehicle) => (map[v.id] = v));
          setVehiclesById(map);
        } else {
          setVehiclesById({});
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const vehicleLabel = (req: Req) => {
    const v = req.vehicle_id ? vehiclesById[req.vehicle_id] : undefined;
    if (!v) return '(No vehicle)';
    const pieces: string[] = [];
    if (v.unit_number) pieces.push(String(v.unit_number));
    const meta = [v.year, v.make, v.model].filter(Boolean).join(' ');
    if (meta) pieces.push(meta);
    if (v.plate) pieces.push(`(${v.plate})`);
    return pieces.join(' — ') || '(Vehicle)';
  };

  async function onComplete(id: string) {
    try {
      setBusyId(id);
      setError('');
      const res = await fetch(`/api/requests/${id}/complete`, { method: 'PATCH' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Failed to complete');
      // Remove from list (or reload)
      setRows(prev => prev.filter(r => r.id !== id));
    } catch (e: any) {
      setError(e.message || 'Failed to complete');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-3 flex items-center gap-2">
        <h1 className="text-xl font-semibold">Tech Queue — In Progress</h1>
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

      <table className="w-full border rounded">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="p-3">Created</th>
            <th className="p-3">Vehicle</th>
            <th className="p-3">Service</th>
            <th className="p-3">Priority</th>
            <th className="p-3">Preferred</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">
                No in-progress requests.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3">{vehicleLabel(r)}</td>
                <td className="p-3">{r.service_type}</td>
                <td className="p-3">{r.priority}</td>
                <td className="p-3">
                  {r.preferred_date_1 ? new Date(r.preferred_date_1).toLocaleDateString() : '—'}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => onComplete(r.id)}
                    disabled={busyId === r.id}
                    className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {busyId === r.id ? 'Completing…' : 'Complete'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
