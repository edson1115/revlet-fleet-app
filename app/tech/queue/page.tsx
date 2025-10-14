// app/tech/queue/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';
import { useSuccessQueryToast } from '@/app/components/useSuccessQueryToast';

type RequestRow = {
  id: string;
  vehicle_id: string | null;
  customer_id: string | null;
  status: string;
  service_type?: string | null;
  started_at?: string | null;
  odometer_miles?: number | null;
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

export default function TechQueuePage() {
  const router = useRouter();
  const { show, Toast } = useToast();
  useSuccessQueryToast(show);

  const [rows, setRows] = useState<RequestRow[]>([]);
  const [vehiclesById, setVehiclesById] = useState<Record<string, VehicleLite | undefined>>({});
  const [customersById, setCustomersById] = useState<Record<string, CustomerLite | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // modal state (complete)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalId, setModalId] = useState<string | null>(null);
  const [odo, setOdo] = useState<string>('');
  // recommendations
  const [reco, setReco] = useState({
    tires_tread_32: '',
    wipers: '',
    brakes_mm: '',
    lights: '',
    cabin_air: '',
    tire_rotation: '',
    notes: '',
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Load both SCHEDULED and IN_PROGRESS so tech can mark Arrived on scheduled jobs
      const [schedRes, progRes] = await Promise.all([
        fetch('/api/requests?status=SCHEDULED', { cache: 'no-store' }),
        fetch('/api/requests?status=IN_PROGRESS', { cache: 'no-store' }),
      ]);
      const s = (await safeJson(schedRes)) as RequestsResponse | null;
      const p = (await safeJson(progRes)) as RequestsResponse | null;

      const rowsCombined = [
        ...(s?.rows || []),
        ...(p?.rows || []),
      ];
      const vmap = { ...(s?.vehiclesById || {}), ...(p?.vehiclesById || {}) };
      const cmap = { ...(s?.customersById || {}), ...(p?.customersById || {}) };

      setRows(rowsCombined);
      setVehiclesById(vmap);
      setCustomersById(cmap);
    } catch (e: any) {
      setError(e?.message || 'Network error while loading tech queue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const view = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        vehicleLabel: r.vehicle_id ? formatVehicle(vehiclesById[r.vehicle_id]) : '—',
        customerLabel: r.customer_id ? (customersById[r.customer_id]?.name ?? '—') : '—',
        startedWhen: r.started_at ? new Date(r.started_at).toLocaleString() : '—',
      })),
    [rows, vehiclesById, customersById]
  );

  async function onArrived(id: string) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/requests/${id}/start`, { method: 'PATCH' });
    if (res.ok) {
      router.replace('/tech/queue?started=1');
      setTimeout(load, 80);
    } else {
      const b = await safeJson(res);
      setError(b?.error || `Failed to start request (${res.status})`);
      setBusyId(null);
    }
  }

  function openCompleteModal(id: string, current?: number | null) {
    setModalId(id);
    setOdo(current != null ? String(current) : '');
    setReco({
      tires_tread_32: '',
      wipers: '',
      brakes_mm: '',
      lights: '',
      cabin_air: '',
      tire_rotation: '',
      notes: '',
    });
    setModalOpen(true);
  }

  async function submitComplete() {
    if (!modalId) return;
    setBusyId(modalId);
    setError(null);

    const parsed = odo.trim() === '' ? null : Number(odo);
    if (parsed != null && (!Number.isFinite(parsed) || parsed < 0)) {
      setError('Please enter a valid odometer value (non-negative number) or leave blank.');
      setBusyId(null);
      return;
    }

    const res = await fetch(`/api/requests/${modalId}/complete`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        odometer_miles: parsed,
        recommendations: reco, // ← NEW
      }),
    });

    setModalOpen(false);
    setModalId(null);

    if (res.ok) {
      router.replace('/tech/queue?completed=1');
      setTimeout(load, 80);
    } else {
      const body = await safeJson(res);
      setError(body?.error || `Failed to complete request (${res.status})`);
      setBusyId(null);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <Toast />
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Tech Queue</h1>
        <span className="text-sm text-gray-500">{loading ? 'Loading…' : `${rows.length} items`}</span>
      </div>

      {error && <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}

      {loading ? (
        <div className="text-sm text-gray-600">Fetching jobs…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-600">No jobs.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Vehicle</th>
                <th className="pr-4">Customer</th>
                <th className="pr-4">Service</th>
                <th className="pr-4">Status</th>
                <th className="pr-4">Started</th>
                <th className="pr-4">Odometer</th>
                <th className="w-[1%]"></th>
              </tr>
            </thead>
            <tbody>
              {view.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 pr-4">{r.vehicleLabel}</td>
                  <td className="pr-4">{r.customerLabel}</td>
                  <td className="pr-4">{r.service_type ?? '—'}</td>
                  <td className="pr-4">{r.status}</td>
                  <td className="pr-4">{r.startedWhen}</td>
                  <td className="pr-4">{r.odometer_miles ?? '—'}</td>
                  <td className="py-2">
                    {r.status === 'SCHEDULED' ? (
                      <button
                        onClick={() => onArrived(r.id)}
                        disabled={busyId === r.id}
                        className="px-3 py-1 rounded border disabled:opacity-50"
                      >
                        {busyId === r.id ? 'Arriving…' : 'Arrived'}
                      </button>
                    ) : (
                      <button
                        onClick={() => openCompleteModal(r.id, r.odometer_miles)}
                        disabled={busyId === r.id}
                        className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
                      >
                        {busyId === r.id ? 'Completing…' : 'Complete'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Complete modal with recommendations */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-semibold mb-3">Complete — Add Details</h2>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Odometer (mi)
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full border rounded px-3 py-2 mt-1"
                  placeholder="e.g. 123456"
                  value={odo}
                  onChange={(e) => setOdo(e.target.value)}
                />
              </label>

              <label className="text-sm">
                Tire tread (32nds)
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={reco.tires_tread_32}
                  onChange={(e) => setReco({ ...reco, tires_tread_32: e.target.value })}
                />
              </label>

              <label className="text-sm">
                Wipers
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  placeholder="ok / replace"
                  value={reco.wipers}
                  onChange={(e) => setReco({ ...reco, wipers: e.target.value })}
                />
              </label>

              <label className="text-sm">
                Brakes (mm)
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={reco.brakes_mm}
                  onChange={(e) => setReco({ ...reco, brakes_mm: e.target.value })}
                />
              </label>

              <label className="text-sm">
                Lights
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={reco.lights}
                  onChange={(e) => setReco({ ...reco, lights: e.target.value })}
                />
              </label>

              <label className="text-sm">
                Cabin air
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={reco.cabin_air}
                  onChange={(e) => setReco({ ...reco, cabin_air: e.target.value })}
                />
              </label>

              <label className="text-sm">
                Tire rotation
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={reco.tire_rotation}
                  onChange={(e) => setReco({ ...reco, tire_rotation: e.target.value })}
                />
              </label>
            </div>

            <label className="text-sm block mt-3">
              Notes
              <textarea
                rows={3}
                className="w-full border rounded px-3 py-2 mt-1"
                value={reco.notes}
                onChange={(e) => setReco({ ...reco, notes: e.target.value })}
              />
            </label>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setModalOpen(false); setModalId(null); }} className="px-3 py-1 rounded border">
                Cancel
              </button>
              <button onClick={submitComplete} className="px-3 py-1 rounded bg-black text-white">
                Save & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
