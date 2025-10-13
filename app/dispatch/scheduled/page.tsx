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

export default function DispatchScheduledPage() {
  const [rows, setRows] = useState<Req[]>([]);
  const [vehiclesById, setVehiclesById] = useState<Record<string, Vehicle>>({});
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const res = await fetch('/api/requests?status=SCHEDULED&limit=50', { cache: 'no-store' });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setError(j?.error || 'Failed to load'); return; }
    setRows(j.requests ?? []);
    setVehiclesById(j.vehiclesById ?? {});
  }

  useEffect(() => { load(); }, []);

  const vehicleLabel = (r: Req) => {
    const v = r.vehicle_id ? vehiclesById[r.vehicle_id] : undefined;
    if (!v) return "(No vehicle)";
    const parts: string[] = [];
    if (v.unit_number) parts.push(v.unit_number);
    const meta = [v.year, v.make, v.model].filter(Boolean).join(" ");
    if (meta) parts.push(meta);
    if (v.plate) parts.push(`(${v.plate})`);
    return parts.join(" — ") || "(Vehicle)";
  };

  async function markInProgress(id: string) {
    const res = await fetch(`/api/requests/${id}/start`, { method: 'PATCH' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error || 'Failed to start');
      return;
    }
    await load(); // remove from list
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-3 flex items-center gap-2">
        <h1 className="text-xl font-semibold">Dispatch — Scheduled</h1>
        <button onClick={load} className="ml-auto px-4 py-2 rounded border bg-white hover:bg-gray-50">
          Refresh
        </button>
      </div>

      <div className="mb-3 flex items-center gap-2">
  <h1 className="text-xl font-semibold">Office Queue — NEW Requests</h1>
  <button onClick={load} className="ml-auto px-4 py-2 rounded border bg-white hover:bg-gray-50">
    Refresh
  </button>
</div>


      {error && <div className="mb-3 p-3 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}

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
            <tr><td colSpan={6} className="p-4 text-center text-gray-500">No scheduled requests.</td></tr>
          ) : rows.map(r => (
            <tr key={r.id} className="border-t">
              <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
              <td className="p-3">{vehicleLabel(r)}</td>
              <td className="p-3">{r.service_type}</td>
              <td className="p-3">{r.priority}</td>
              <td className="p-3">{r.preferred_date_1 ? new Date(r.preferred_date_1).toLocaleDateString() : '-'}</td>
              <td className="p-3">
                <button
                  onClick={() => markInProgress(r.id)}
                  className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Mark In Progress
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
