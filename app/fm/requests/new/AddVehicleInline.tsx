'use client';
import { useState } from 'react';

type Props = {
  companyId?: string;                       // ✅ new
  onCreated: (vehicleId: string) => Promise<void> | void;
};

export default function AddVehicleInline({ companyId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // controlled fields (so we don't need a nested <form>)
  const [year, setYear] = useState<string>('');
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [vin, setVin] = useState<string>('');
  const [unitNumber, setUnitNumber] = useState<string>('');
  const [plate, setPlate] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  async function saveVehicle() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,              // ✅ send it
        year: year || null,
        make: make || null,
        model: model || null,
        vin: vin || null,
        unit_number: unitNumber || null,
        plate: plate || null,
        location: location || null,
        }),
      });

      const ct = res.headers.get('content-type') || '';
      const body = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);

      const id = body?.id as string;
      if (!id) throw new Error('Vehicle created but no id returned');

      await onCreated(id); // parent refreshes + selects
      // reset + collapse
      setYear(''); setMake(''); setModel(''); setVin('');
      setUnitNumber(''); setPlate(''); setLocation('');
      setOpen(false);
    } catch (ex: any) {
      setErr(ex?.message ?? 'Failed to create vehicle');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        className="text-sm underline"
        onClick={() => setOpen(o => !o)}
      >
        {open ? 'Cancel' : '+ Add Vehicle'}
      </button>

      {open && (
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border p-3">
          <input value={year} onChange={e=>setYear(e.target.value)} placeholder="Year" className="border p-2 rounded" />
          <input value={make} onChange={e=>setMake(e.target.value)} placeholder="Make" className="border p-2 rounded" />
          <input value={model} onChange={e=>setModel(e.target.value)} placeholder="Model" className="border p-2 rounded" />
          <input value={vin} onChange={e=>setVin(e.target.value)} placeholder="VIN" className="border p-2 rounded col-span-2" />
          <input value={unitNumber} onChange={e=>setUnitNumber(e.target.value)} placeholder="Unit #" className="border p-2 rounded" />
          <input value={plate} onChange={e=>setPlate(e.target.value)} placeholder="Plate" className="border p-2 rounded" />
          <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Location (optional)" className="border p-2 rounded col-span-2" />
          {err && <div className="text-red-600 text-sm col-span-2">{err}</div>}
          <div className="col-span-2">
            <button
              type="button"
              onClick={saveVehicle}
              disabled={busy}
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
            >
              {busy ? 'Saving…' : 'Save Vehicle'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
