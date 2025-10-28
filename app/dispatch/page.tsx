'use client';

import { useEffect, useMemo, useState } from 'react';

type Technician = { id: string; label?: string | null };
type SimpleOpt = { id: string; label: string };
type RequestRow = {
  id: string;
  status: 'NEW' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | string;
  created_at?: string;
  scheduled_at?: string | null;
  service?: string | null;
  customer?: { id: string; name?: string | null } | null;
  location?: { id: string; name?: string | null } | null;
  vehicle?: { id: string; unit_number?: string | null; year?: number | null; make?: string | null; model?: string | null } | null;
  technician?: { id: string | null } | null;
};

async function fetchJSON<T>(url: string) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` – ${text}` : ''}`);
  }
  return res.json() as Promise<T>;
}

async function postJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` – ${text}` : ''}`);
  }
  return res.json() as Promise<T>;
}

export default function DispatchPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [statusFilter, setStatusFilter] = useState<'NEW' | 'SCHEDULED'>('NEW');
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const [assignTechId, setAssignTechId] = useState<string>('');
  const [reschedAt, setReschedAt] = useState<string>(''); // datetime-local
  const [reschedStatus, setReschedStatus] = useState<'SCHEDULED' | 'NEW' | 'IN_PROGRESS' | 'COMPLETED'>('SCHEDULED');

  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string>('');
  const [toast, setToast] = useState<string>('');

  // Quick Create modal state
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [ccCustomers, setCcCustomers] = useState<SimpleOpt[]>([]);
  const [ccLocations, setCcLocations] = useState<SimpleOpt[]>([]);
  const [ccVehicles, setCcVehicles] = useState<SimpleOpt[]>([]);
  const [ccCustomerId, setCcCustomerId] = useState<string>('');
  const [ccLocationId, setCcLocationId] = useState<string>('');
  const [ccVehicleId, setCcVehicleId] = useState<string>('');
  const [ccService, setCcService] = useState<string>('');
  const [ccStatus, setCcStatus] = useState<'NEW' | 'SCHEDULED'>('NEW');
  const [ccScheduledAt, setCcScheduledAt] = useState<string>(''); // only used if SCHEDULED
  const [ccBusy, setCcBusy] = useState<boolean>(false);
  const [ccErr, setCcErr] = useState<string>('');

  // Load technicians
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchJSON<{ success: boolean; data: Technician[] }>('/api/lookups?scope=technicians');
        if (mounted) setTechs(data.data ?? []);
      } catch {
        if (mounted) setTechs([]); // do not block UI
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load requests for NEW/SCHEDULED
  async function refresh() {
    const q = new URLSearchParams({ status: statusFilter });
    const data = await fetchJSON<{ rows: RequestRow[] }>(`/api/requests?${q.toString()}`);
    setRows(data.rows ?? []);
  }

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr('');
    setSelected({});
    (async () => {
      try {
        await refresh();
      } catch (e: any) {
        if (mounted) setErr(e?.message || 'Failed to load requests.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [statusFilter]);

  const allChecked = useMemo(() => {
    const ids = rows.map(r => r.id);
    return ids.length > 0 && ids.every(id => selected[id]);
  }, [rows, selected]);

  const anyChecked = useMemo(() => Object.values(selected).some(Boolean), [selected]);

  const techMap = useMemo(() => new Map(techs.map(t => [t.id, t.label ?? t.id])), [techs]);

  function toggleAll() {
    const next: Record<string, boolean> = {};
    if (!allChecked) rows.forEach(r => { next[r.id] = true; });
    setSelected(next);
  }

  function toggleOne(id: string) {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  }

  async function run(op: string, payload: Record<string, any> = {}) {
    try {
      setErr('');
      setToast('');
      const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
      if (ids.length === 0) throw new Error('Select at least one request.');
      await postJSON('/api/requests/batch', { op, ids, ...payload });
      setToast(`${op} done for ${ids.length} request(s).`);
      await refresh();
      setSelected({});
    } catch (e: any) {
      setErr(e?.message || `Batch ${op} failed.`);
    }
  }

  async function doAssign() {
    if (!assignTechId) {
      setErr('Pick a technician to assign.');
      return;
    }
    await run('assign', { technician_id: assignTechId });
  }

  async function doUnassign() {
    await run('unassign');
  }

  async function doReschedule() {
    if (!reschedAt) {
      setErr('Pick a date/time to reschedule.');
      return;
    }
    const iso = new Date(reschedAt).toISOString();
    await run('reschedule', { scheduled_at: iso, status: reschedStatus || undefined });
  }

  async function setStatus(status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED') {
    await run('status', { status });
  }

  // ===== Quick Create helpers =====
  async function openCreateModal() {
    setCcErr('');
    setCcBusy(false);
    setCcCustomerId('');
    setCcLocationId('');
    setCcVehicleId('');
    setCcService('');
    setCcStatus('NEW');
    setCcScheduledAt('');
    setShowCreate(true);

    // Load lookups in parallel (schema-safe route you already added)
    const [cust, loc, veh] = await Promise.allSettled([
      fetchJSON<{ success: boolean; data: SimpleOpt[] }>('/api/lookups?scope=customers'),
      fetchJSON<{ success: boolean; data: SimpleOpt[] }>('/api/lookups?scope=locations'),
      fetchJSON<{ success: boolean; data: SimpleOpt[] }>('/api/lookups?scope=vehicles'),
    ]);

    setCcCustomers(cust.status === 'fulfilled' ? (cust.value.data ?? []) : []);
    setCcLocations(loc.status === 'fulfilled' ? (loc.value.data ?? []) : []);
    setCcVehicles(veh.status === 'fulfilled' ? (veh.value.data ?? []) : []);
  }

  async function createRequest() {
    try {
      setCcBusy(true);
      setCcErr('');
      if (!ccCustomerId || !ccLocationId || !ccVehicleId || !ccService.trim()) {
        throw new Error('Please complete Customer, Location, Vehicle, and Service.');
      }
      const payload: any = {
        customer_id: ccCustomerId,
        location_id: ccLocationId,
        vehicle_id: ccVehicleId,
        service: ccService.trim(),
        status: ccStatus,
      };
      if (ccStatus === 'SCHEDULED') {
        if (!ccScheduledAt) throw new Error('Pick a date/time for SCHEDULED status.');
        payload.scheduled_at = new Date(ccScheduledAt).toISOString(); // your POST auto-sets if status === SCHEDULED; this is harmless
      }

      await postJSON('/api/requests', payload);
      setToast('Request created.');
      setShowCreate(false);
      await refresh();
    } catch (e: any) {
      setCcErr(e?.message || 'Create failed.');
    } finally {
      setCcBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Dispatch</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-md border bg-black text-white"
          >
            + Quick Create Request
          </button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'NEW' | 'SCHEDULED')}
            className="border rounded-md px-3 py-2"
            aria-label="Status"
          >
            <option value="NEW">NEW</option>
            <option value="SCHEDULED">SCHEDULED</option>
          </select>
        </div>
      </div>

      {err ? (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-800 p-3">
          <div className="font-medium">Action failed</div>
          <div className="text-sm opacity-90 mt-1">{err}</div>
        </div>
      ) : null}

      {toast ? (
        <div className="rounded-md border border-green-300 bg-green-50 text-green-800 p-3">
          <div className="text-sm">{toast}</div>
        </div>
      ) : null}

      {/* Batch Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Assign / Unassign */}
        <div className="border rounded-xl p-4 space-y-3">
          <div className="font-medium">Batch: Assign / Unassign Technician</div>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <select
              value={assignTechId}
              onChange={(e) => setAssignTechId(e.target.value)}
              className="border rounded-md px-3 py-2 min-w-56"
              aria-label="Technician"
            >
              <option value="">Select technician…</option>
              {techs.map(t => (
                <option key={t.id} value={t.id}>
                  {t.label || 'Unnamed'}
                </option>
              ))}
            </select>
            <button
              onClick={doAssign}
              disabled={!anyChecked}
              className="px-4 py-2 rounded-md border bg-black text-white disabled:opacity-40"
            >
              Assign to Selected
            </button>
            <button
              onClick={doUnassign}
              disabled={!anyChecked}
              className="px-4 py-2 rounded-md border bg-white text-black disabled:opacity-40"
            >
              Unassign
            </button>
          </div>
          <p className="text-xs text-gray-500">Tip: select rows below, then choose a tech (or Unassign).</p>
        </div>

        {/* Reschedule */}
        <div className="border rounded-xl p-4 space-y-3">
          <div className="font-medium">Batch: Reschedule</div>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <input
              type="datetime-local"
              value={reschedAt}
              onChange={(e) => setReschedAt(e.target.value)}
              className="border rounded-md px-3 py-2"
              aria-label="Reschedule at"
            />
          <select
              value={reschedStatus}
              onChange={(e) => setReschedStatus(e.target.value as any)}
              className="border rounded-md px-3 py-2"
              aria-label="Status on reschedule"
            >
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="NEW">NEW</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
            <button
              onClick={doReschedule}
              disabled={!anyChecked}
              className="px-4 py-2 rounded-md border bg-black text-white disabled:opacity-40"
            >
              Reschedule Selected
            </button>
          </div>
          <p className="text-xs text-gray-500">Pick a date/time, optionally change status, then apply to selected rows.</p>
        </div>

        {/* Quick Status */}
        <div className="border rounded-xl p-4 space-y-3">
          <div className="font-medium">Batch: Quick Status</div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setStatus('NEW')}
              disabled={!anyChecked}
              className="px-4 py-2 rounded-md border bg-white text-black disabled:opacity-40"
            >
              Set NEW
            </button>
            <button
              onClick={() => setStatus('IN_PROGRESS')}
              disabled={!anyChecked}
              className="px-4 py-2 rounded-md border bg-white text-black disabled:opacity-40"
            >
              Set IN_PROGRESS
            </button>
            <button
              onClick={() => setStatus('COMPLETED')}
              disabled={!anyChecked}
              className="px-4 py-2 rounded-md border bg-white text-black disabled:opacity-40"
            >
              Set COMPLETED
            </button>
          </div>
          <p className="text-xs text-gray-500">Status updates apply immediately to selected rows.</p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="animate-pulse text-sm text-gray-600">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Vehicle</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Service</th>
                <th className="py-2 pr-4">Technician</th>
                <th className="py-2 pr-4">Scheduled</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={9}>No requests.</td>
                </tr>
              ) : rows.map((r) => {
                const ymk = [r.vehicle?.year, r.vehicle?.make, r.vehicle?.model].filter(Boolean).join(' ');
                const vehicleLabel = r.vehicle?.unit_number
                  ? `${r.vehicle.unit_number}${ymk ? ` — ${ymk}` : ''}`
                  : (ymk || '—');
                const techLabel = r.technician?.id ? (techMap.get(r.technician.id) ?? r.technician.id) : '—';
                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4">
                      <input
                        type="checkbox"
                        checked={!!selected[r.id]}
                        onChange={() => toggleOne(r.id)}
                        aria-label={`Select ${r.id}`}
                      />
                    </td>
                    <td className="py-2 pr-4">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                    <td className="py-2 pr-4">{r.status || '—'}</td>
                    <td className="py-2 pr-4">{r.customer?.name || '—'}</td>
                    <td className="py-2 pr-4">{vehicleLabel}</td>
                    <td className="py-2 pr-4">{r.location?.name || '—'}</td>
                    <td className="py-2 pr-4">{r.service || '—'}</td>
                    <td className="py-2 pr-4">{techLabel}</td>
                    <td className="py-2 pr-4">{r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Quick Create Modal ===== */}
      {showCreate ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !ccBusy) setShowCreate(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Quick Create Request</h2>
              <button
                onClick={() => !ccBusy && setShowCreate(false)}
                className="px-3 py-1 rounded-md border"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {ccErr ? (
              <div className="rounded-md border border-red-300 bg-red-50 text-red-800 p-2 mb-3 text-sm">
                {ccErr}
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="block mb-1">Customer</span>
                <select
                  value={ccCustomerId}
                  onChange={(e) => setCcCustomerId(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="">Select…</option>
                  {ccCustomers.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </label>

              <label className="block text-sm">
                <span className="block mb-1">Location</span>
                <select
                  value={ccLocationId}
                  onChange={(e) => setCcLocationId(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="">Select…</option>
                  {ccLocations.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </label>

              <label className="block text-sm md:col-span-2">
                <span className="block mb-1">Vehicle</span>
                <select
                  value={ccVehicleId}
                  onChange={(e) => setCcVehicleId(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="">Select…</option>
                  {ccVehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </label>

              <label className="block text-sm md:col-span-2">
                <span className="block mb-1">Service</span>
                <input
                  value={ccService}
                  onChange={(e) => setCcService(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="e.g., Oil change & inspection"
                />
              </label>

              <label className="block text-sm">
                <span className="block mb-1">Status</span>
                <select
                  value={ccStatus}
                  onChange={(e) => setCcStatus(e.target.value as any)}
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="NEW">NEW</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                </select>
              </label>

              {ccStatus === 'SCHEDULED' ? (
                <label className="block text-sm">
                  <span className="block mb-1">Scheduled At</span>
                  <input
                    type="datetime-local"
                    value={ccScheduledAt}
                    onChange={(e) => setCcScheduledAt(e.target.value)}
                    className="border rounded-md px-3 py-2 w-full"
                  />
                </label>
              ) : <div /> }
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => !ccBusy && setShowCreate(false)}
                className="px-4 py-2 rounded-md border bg-white"
                disabled={ccBusy}
              >
                Cancel
              </button>
              <button
                onClick={createRequest}
                className="px-4 py-2 rounded-md border bg-black text-white disabled:opacity-40"
                disabled={ccBusy}
              >
                {ccBusy ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
