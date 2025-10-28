'use client';

import { useEffect, useState } from 'react';

type Opt = { id: string; label: string };

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

export default function CustomerCreateRequestPage() {
  // ====== NEW: auth flag ======
  const [authed, setAuthed] = useState(true);

  const [customerId, setCustomerId] = useState<string>('');
  const [vehicles, setVehicles] = useState<Opt[]>([]);
  const [locations, setLocations] = useState<Opt[]>([]);
  const [fmcs, setFmcs] = useState<Opt[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  // form
  const [vehicleId, setVehicleId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [service, setService] = useState('');
  const [fmc, setFmc] = useState('');
  const [priority, setPriority] = useState<'LOW'|'NORMAL'|'HIGH'>('NORMAL');
  const [mileage, setMileage] = useState<string>('');
  const [po, setPo] = useState('');
  const [notes, setNotes] = useState('');

  // Add vehicle modal
  const [showAddVeh, setShowAddVeh] = useState(false);
  const [vehUnit, setVehUnit] = useState('');
  const [vehYear, setVehYear] = useState('');
  const [vehMake, setVehMake] = useState('');
  const [vehModel, setVehModel] = useState('');
  const [vehPlate, setVehPlate] = useState('');

  // ====== NEW: Boot: detect auth (guest allowed), then load lookups ======
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Hit /api/me directly so 401 doesn't throw — we handle guest mode gracefully.
        const meRes = await fetch('/api/me', { credentials: 'include' });

        if (meRes.status === 401) {
          if (!mounted) return;
          setAuthed(false);
          setCustomerId('');

          // Optional: still load public lookups (locations/FMCs) for display
          try {
            const [loc, fmcList] = await Promise.all([
              fetchJSON<{ success: boolean; data: Opt[] }>('/api/lookups?scope=locations'),
              fetchJSON<{ success: boolean; data: Opt[] }>('/api/lookups?scope=fmcs'),
            ]);
            if (!mounted) return;
            setLocations(loc.data ?? []);
            setFmcs(fmcList.data ?? []);
          } catch {}
          return;
        }

        if (!meRes.ok) {
          const t = await meRes.text().catch(() => '');
          throw new Error(`HTTP ${meRes.status} ${meRes.statusText}${t ? ` – ${t}` : ''}`);
        }

        const me = (await meRes.json()) as { customer_id?: string | null };
        const cid = me.customer_id ?? '';
        if (!cid) {
          if (!mounted) return;
          setAuthed(true); // signed in but no customer binding
          setErr('Your profile is missing customer access. Please contact support.');
          return;
        }

        if (!mounted) return;
        setAuthed(true);
        setCustomerId(cid);

        const [veh, loc, fmcList] = await Promise.all([
          fetchJSON<any[]>('/api/vehicles?customer_id=' + encodeURIComponent(cid)),
          fetchJSON<{ success: boolean; data: Opt[] }>('/api/lookups?scope=locations'),
          fetchJSON<{ success: boolean; data: Opt[] }>('/api/lookups?scope=fmcs'),
        ]);

        if (!mounted) return;
        setVehicles(
          (veh ?? []).map((v: any) => {
            const ymk = [v.year, v.make, v.model].filter(Boolean).join(' ');
            return { id: v.id, label: v.unit_number || ymk || v.plate || v.id };
          })
        );
        setLocations(loc.data ?? []);
        setFmcs(fmcList.data ?? []);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || 'Failed to load');
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function refreshVehicles() {
    if (!customerId) return;
    const veh = await fetchJSON<any[]>('/api/vehicles?customer_id=' + encodeURIComponent(customerId));
    setVehicles(
      (veh ?? []).map((v: any) => {
        const ymk = [v.year, v.make, v.model].filter(Boolean).join(' ');
        return { id: v.id, label: v.unit_number || ymk || v.plate || v.id };
      })
    );
  }

  // ====== NEW: Guard addVehicle for guests ======
  async function addVehicle() {
    try {
      if (!authed) throw new Error('Please sign in to add a vehicle.');
      setBusy(true);
      setErr(''); setOk('');
      if (!customerId) throw new Error('Missing customer id');
      const body: any = { customer_id: customerId };
      if (vehUnit.trim()) body.unit_number = vehUnit.trim();
      if (vehPlate.trim()) body.plate = vehPlate.trim();
      if (vehYear && vehMake.trim() && vehModel.trim()) {
        body.year = Number(vehYear);
        body.make = vehMake.trim();
        body.model = vehModel.trim();
      }
      if (!body.unit_number) throw new Error('Unit number is required');

      const resp = await postJSON<{ id: string }>('/api/vehicles', body);
      setOk('Vehicle added.');
      setShowAddVeh(false);
      setVehUnit(''); setVehYear(''); setVehMake(''); setVehModel(''); setVehPlate('');
      await refreshVehicles();
      setVehicleId(resp.id);
    } catch (e: any) {
      setErr(e?.message || 'Add vehicle failed.');
    } finally {
      setBusy(false);
    }
  }

  // ====== NEW: Guard submit for guests ======
  async function submit() {
    try {
      if (!authed) throw new Error('Please sign in to submit a request.');
      setBusy(true);
      setErr(''); setOk('');
      if (!vehicleId || !locationId || !service.trim()) {
        throw new Error('Vehicle, Location, Service are required.');
      }
      if (!customerId) throw new Error('Missing customer id');

      const body: any = {
        customer_id: customerId,
        vehicle_id: vehicleId,
        location_id: locationId,
        service: service.trim(),
        status: "NEW",
        notes: notes.trim() || null,
        po: po.trim() || null,
        priority,
      };
      if (fmc) body.fmc = fmc;
      if (mileage) body.mileage = Number(mileage);

      await postJSON<{ id: string }>('/api/requests', body);
      setOk('Request submitted.');
      // clear form but keep lookups
      setVehicleId(''); setLocationId(''); setService('');
      setFmc(''); setPriority('NORMAL'); setMileage(''); setPo(''); setNotes('');
    } catch (e: any) {
      setErr(e?.message || 'Submit failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Create Service Request</h1>

      {/* ====== NEW: Guest banner ====== */}
      {!authed ? (
        <div className="border border-amber-300 bg-amber-50 text-amber-900 p-2 rounded text-sm">
          You’re browsing as <b>Guest</b>. Please sign in to submit a request or add a vehicle.
        </div>
      ) : null}

      {err ? <div className="border border-red-300 bg-red-50 text-red-800 p-2 rounded">{err}</div> : null}
      {ok ? <div className="border border-green-300 bg-green-50 text-green-800 p-2 rounded">{ok}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="block mb-1">Vehicle</span>
          <div className="flex gap-2">
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="border rounded-md px-3 py-2 w-full"
              disabled={!authed || busy}
            >
              <option value="">Select your vehicle…</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
            <button
              type="button"
              onClick={() => setShowAddVeh(true)}
              className="px-3 py-2 border rounded-md disabled:opacity-40"
              disabled={!authed || busy}
            >
              + Add Vehicle
            </button>
          </div>
        </label>

        <label className="block text-sm">
          <span className="block mb-1">Location</span>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
            disabled={!authed || busy}
          >
            <option value="">Select…</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>

        <label className="block text-sm md:col-span-2">
          <span className="block mb-1">Service</span>
          <input
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
            placeholder="Describe the service needed"
            disabled={!authed || busy}
          />
        </label>

        <label className="block text-sm">
          <span className="block mb-1">FMC</span>
          <select
            value={fmc}
            onChange={(e) => setFmc(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
            disabled={!authed || busy}
          >
            <option value="">Select…</option>
            {fmcs.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>

        <label className="block text-sm">
          <span className="block mb-1">Priority</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="border rounded-md px-3 py-2 w-full"
            disabled={!authed || busy}
          >
            <option value="LOW">LOW</option>
            <option value="NORMAL">NORMAL</option>
            <option value="HIGH">HIGH</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="block mb-1">Mileage</span>
          <input
            type="number"
            inputMode="numeric"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
            placeholder="Odometer"
            disabled={!authed || busy}
          />
        </label>

        <label className="block text-sm">
          <span className="block mb-1">PO</span>
          <input
            value={po}
            onChange={(e) => setPo(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
            placeholder="PO Number (optional)"
            disabled={!authed || busy}
          />
        </label>

        <label className="block text-sm md:col-span-2">
          <span className="block mb-1">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border rounded-md px-3 py-2 w-full min-h-[120px]"
            placeholder="Anything else we should know?"
            disabled={!authed || busy}
          />
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={submit}
          className="px-4 py-2 rounded-md border bg-black text-white disabled:opacity-40"
          disabled={!authed || busy}
        >
          {busy ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>

      {/* Add Vehicle modal */}
      {showAddVeh ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog" aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddVeh(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Add Vehicle</div>
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setShowAddVeh(false)}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="block mb-1">Unit # <span className="text-red-600">*</span></span>
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  value={vehUnit}
                  onChange={(e) => setVehUnit(e.target.value)}
                  disabled={!authed || busy}
                />
              </label>
              <label className="block text-sm">
                <span className="block mb-1">Plate</span>
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  value={vehPlate}
                  onChange={(e) => setVehPlate(e.target.value)}
                  disabled={!authed || busy}
                />
              </label>
              <label className="block text-sm">
                <span className="block mb-1">Year</span>
                <input
                  type="number"
                  className="border rounded-md px-3 py-2 w-full"
                  value={vehYear}
                  onChange={(e) => setVehYear(e.target.value)}
                  disabled={!authed || busy}
                />
              </label>
              <label className="block text-sm">
                <span className="block mb-1">Make</span>
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  value={vehMake}
                  onChange={(e) => setVehMake(e.target.value)}
                  disabled={!authed || busy}
                />
              </label>
              <label className="block text-sm md:col-span-2">
                <span className="block mb-1">Model</span>
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  value={vehModel}
                  onChange={(e) => setVehModel(e.target.value)}
                  disabled={!authed || busy}
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 border rounded"
                onClick={() => setShowAddVeh(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 border rounded bg-black text-white disabled:opacity-40"
                onClick={addVehicle}
                disabled={!authed || busy}
              >
                {busy ? 'Adding…' : 'Add Vehicle'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
