'use client';

import { useEffect, useMemo, useState } from 'react';
import AddVehicleButton from './AddVehicleButton'; // <= make sure this file exists (I sent it earlier)

type Id = string;

type Vehicle = { id: Id; year: number | null; make: string; model: string; unit_number: string | null };
type Location = { id: Id; name: string };
type Customer = { id: Id; name: string };

// These must match your DB enum labels exactly (case sensitive)
const FMC_OPTIONS = [
  'LMR',
  'Element',
  'Enterprise Fleet',
  'Merchant',
  'Holman',
  'EAN',
  'Hertz',
  'Fleetio',
  'Other',
] as const;
type FmcLabel = typeof FMC_OPTIONS[number];

export default function NewServiceRequestPage() {
  // lookups
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // form
  const [vehicleId, setVehicleId] = useState<Id | ''>('');
  const [locationId, setLocationId] = useState<Id | ''>('');
  const [customerId, setCustomerId] = useState<Id | ''>('');
  const [service, setService] = useState('Oil Change');
  const [mileage, setMileage] = useState<string>(''); // keep as string for input, coerce on submit
  const [fmc, setFmc] = useState<FmcLabel>('Other');

  const [submitting, setSubmitting] = useState(false);

  // load lookups
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingLookups(true);
      setLookupError(null);
      try {
        const res = await fetch('/api/lookups', { cache: 'no-store' });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `GET /api/lookups failed (${res.status})`);
        }
        const json = await res.json();
        if (!alive) return;

        setVehicles(json.vehicles ?? []);
        setLocations(json.locations ?? []);
        setCustomers(json.customers ?? []);

        if (json.vehicles?.length && !vehicleId) setVehicleId(json.vehicles[0].id);
        if (json.locations?.length && !locationId) setLocationId(json.locations[0].id);
        if (json.customers?.length && !customerId) setCustomerId(json.customers[0].id);
      } catch (e: any) {
        setLookupError(e?.message ?? 'Failed to load lookups');
      } finally {
        if (alive) setLoadingLookups(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  const vehicleLabel = (v: Vehicle) => {
    const unit = v.unit_number ? ` (${v.unit_number})` : '';
    const ym = [v.year, v.make, v.model].filter(Boolean).join(' ');
    return `${ym}${unit}`.trim();
  };

  const canSubmit = useMemo(() => {
    return !!vehicleId && !!locationId && !!customerId && !!service?.trim() && !submitting;
  }, [vehicleId, locationId, customerId, service, submitting]);

  async function handleCreate() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // coerce mileage to integer or null
      const mileageInt =
        mileage.trim() === '' ? null : Number.isNaN(Number(mileage)) ? null : Math.max(0, Math.floor(Number(mileage)));

      const payload: Record<string, any> = {
        vehicle_id: vehicleId,
        location_id: locationId,
        customer_id: customerId, // if your table uses a different column name, map here
        service: service.trim(),
        fmc, // send enum label exactly as in DB
      };

      if (mileageInt !== null) {
        payload.mileage = mileageInt;
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let body: any = null;
      try {
        body = await res.json();
      } catch {
        body = await res.text();
      }

      if (!res.ok || body?.ok === false) {
        const msg = body?.error || (typeof body === 'string' ? body : `HTTP ${res.status}`);
        alert(`Failed to create request: ${msg}`);
        return;
      }

      alert('Service request created!');
      // Reset the bare minimum; keep some convenience selections
      setService('Oil Change');
      setMileage('');
      setFmc('Other');
    } catch (e: any) {
      alert(`Failed to create request: ${e?.message ?? e}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">New Service Request</h1>

      {lookupError && (
        <p className="mb-4 text-red-600">
          Could not load dropdowns: <span className="font-mono">{lookupError}</span>
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column: form */}
        <div className="space-y-6">
          {/* Vehicle + quick add */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Vehicle</label>
              <AddVehicleButton
                fmcOptions={[...FMC_OPTIONS]}
                onCreated={(v) => {
                  // 1) add the new vehicle to our list (front of the list)
                  setVehicles((prev) => [{ id: v.id, year: null, make: '', model: '', unit_number: null, ...labelToParts(v.label) }, ...prev]);
                  // 2) select it
                  setVehicleId(v.id);
                }}
              />
            </div>

            <select
              disabled={loadingLookups}
              className="w-full border rounded px-3 py-2"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value as Id)}
            >
              {vehicles.length === 0 && <option value="">No vehicles found</option>}
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {vehicleLabel(v)}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <select
              disabled={loadingLookups}
              className="w-full border rounded px-3 py-2"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value as Id)}
            >
              {locations.length === 0 && <option value="">No locations found</option>}
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Customer */}
          <div>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <select
              disabled={loadingLookups}
              className="w-full border rounded px-3 py-2"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value as Id)}
            >
              {customers.length === 0 && <option value="">No customers found</option>}
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div>
            <label className="block text-sm font-medium mb-1">Service</label>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Oil Change, A/C diagnostic, etc."
              value={service}
              onChange={(e) => setService(e.target.value)}
            />
          </div>

          {/* FMC & Mileage row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">FMC</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={fmc}
                onChange={(e) => setFmc(e.target.value as FmcLabel)}
              >
                {FMC_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Use “Other” for COD / card jobs.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mileage (odometer)</label>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full border rounded px-3 py-2"
                placeholder="e.g. 72,345"
                value={mileage}
                onChange={(e) => setMileage(e.target.value.replace(/[^\d]/g, ''))}
              />
            </div>
          </div>

          <button
            disabled={!canSubmit}
            onClick={handleCreate}
            className={`inline-flex items-center rounded-lg px-4 py-2 text-white ${
              canSubmit ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Creating…' : 'Create Request'}
          </button>
        </div>

        {/* Right column: recent for customer (placeholder) */}
        <div className="border rounded-lg p-4">
          <div className="font-medium mb-2">Recent for this customer</div>
          <div className="text-sm text-gray-600">
            (Future) Show recent requests for{' '}
            <span className="font-semibold">
              {customers.find((c) => c.id === customerId)?.name ?? 'selected customer'}
            </span>
            .
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Utility: best-effort parse of a label like "2021 Ford Transit (1111)"
 * back into { year, make, model, unit_number } so the newly created vehicle
 * can render a friendly option immediately after creation.
 * If parsing fails, we just keep empty strings/nulls (harmless).
 */
function labelToParts(label: string): Partial<Vehicle> {
  try {
    // Pull "(unit)" if present
    const unitMatch = label.match(/\((.+?)\)\s*$/);
    const unit_number = unitMatch ? unitMatch[1] : null;
    const withoutUnit = label.replace(/\s*\(.+?\)\s*$/, '');

    const parts = withoutUnit.trim().split(/\s+/);
    const year = parts.length ? Number(parts[0]) : null;
    const make = parts[1] ?? '';
    const model = parts.slice(2).join(' ') || '';

    return {
      year: Number.isFinite(year) ? year : null,
      make,
      model,
      unit_number,
    };
  } catch {
    return { year: null, make: '', model: '', unit_number: null };
  }
}
