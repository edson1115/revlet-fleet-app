// app/fm/requests/new/page.tsx
'use client';

import AddVehicleInline from './AddVehicleInline';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Types (allow nullable fields coming from DB)
type Vehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  vin?: string | null;
  unit_number?: string | null;
  plate?: string | null;
};

type Location = { id: string; name: string };

export default function NewRequestPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_type: 'Oil Change',
    fmc: 'Enterprise Fleet',
    priority: 'NORMAL',
    location_id: '',
    customer_notes: '',
    preferred_date_1: '',
    preferred_date_2: '',
    preferred_date_3: '',
    is_emergency: false,
    odometer_miles: '' as number | '', // optional mileage
  });

  // Initial loads
  useEffect(() => {
    (async () => {
      try {
        const vr = await fetch('/api/vehicles');
        const vct = vr.headers.get('content-type') || '';
        const vj = vct.includes('application/json') ? await vr.json() : null;
        if (!vr.ok) throw new Error(vj?.error || `Vehicles HTTP ${vr.status}`);
        setVehicles(vj?.vehicles ?? []);
      } catch (e) {
        console.error('Vehicle load error:', e);
      }

      try {
        const lr = await fetch('/api/lookups');
        const lct = lr.headers.get('content-type') || '';
        const lj = lct.includes('application/json') ? await lr.json() : null;
        if (!lr.ok) throw new Error(lj?.error || `Lookups HTTP ${lr.status}`);
        setLocations(lj?.locations ?? []);
      } catch (e) {
        console.error('Location load error:', e);
      }
    })();
  }, []);

  // Manual reload for the “Refresh” button
  async function reloadVehicles() {
    try {
      const r = await fetch('/api/vehicles');
      const ct = r.headers.get('content-type') || '';
      const j = ct.includes('application/json') ? await r.json() : null;
      if (!r.ok) {
        setError(j?.error || `Failed to load vehicles (HTTP ${r.status})`);
        return;
      }
      setVehicles(j.vehicles ?? []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load vehicles');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // 🔒 client-side guard against empty vehicle_id
    const chosen = (formData.vehicle_id || '').trim();
    if (!chosen) {
      setError('Please select a vehicle before creating the request.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, vehicle_id: chosen }),
      });

      const ct = res.headers.get('content-type') || '';
      const body = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok) throw new Error(body?.error || `Request failed (HTTP ${res.status})`);

      const newId = body?.id as string | undefined;

      // Go straight to Office Queue (NEW requests)
      router.push(newId ? `/office/queue?created=${newId}` : '/office/queue');
    } catch (err: any) {
      setError(err?.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Service Request</h1>

          {/* Errors */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Quick add vehicle (outside the main form to avoid nested forms) */}
          <AddVehicleInline
            onCreated={async (newId) => {
              await reloadVehicles();
              setFormData((prev) => ({ ...prev, vehicle_id: newId }));
            }}
          />

          {/* Helpful banner if no vehicles */}
          {vehicles.length === 0 && (
            <p className="mt-3 mb-4 text-sm text-amber-700 bg-amber-50 p-3 rounded">
              No vehicles found. Add one above, then click Refresh.
            </p>
          )}

          {/* MAIN FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>

              <div className="flex gap-2">
                <select
                  required
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.unit_number ? `${v.unit_number} — ` : ''}
                      {v.year} {v.make} {v.model}
                      {v.plate ? ` (${v.plate})` : ''}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={reloadVehicles}
                  className="px-3 py-2 rounded border bg-white hover:bg-gray-50"
                  title="Reload vehicles"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Mileage (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mileage (odometer)</label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={formData.odometer_miles as any}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    odometer_miles: val === '' ? '' : Number(val),
                  });
                }}
                placeholder="e.g., 45231"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
              <select
                required
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Oil Change">Oil Change</option>
                <option value="Brake Service">Brake Service</option>
                <option value="Tire Service">Tire Service</option>
                <option value="Battery Replacement">Battery Replacement</option>
                <option value="Inspection">Inspection</option>
                <option value="Preventive Maintenance">Preventive Maintenance</option>
                <option value="Diagnostics">Diagnostics</option>
                <option value="Repair">Repair</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* FMC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">FMC *</label>
              <select
                required
                value={formData.fmc}
                onChange={(e) => setFormData({ ...formData, fmc: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LMR">LMR</option>
                <option value="Element">Element</option>
                <option value="Enterprise Fleet">Enterprise Fleet</option>
                <option value="Merchant">Merchant</option>
                <option value="Holman">Holman</option>
                <option value="EAN">EAN</option>
                <option value="Hertz">Hertz</option>
                <option value="Fleetio">Fleetio</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Notes</label>
              <textarea
                value={formData.customer_notes}
                onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
                rows={4}
                placeholder="Describe the service needed or any specific concerns..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date 1</label>
                <input
                  type="date"
                  value={formData.preferred_date_1}
                  onChange={(e) => setFormData({ ...formData, preferred_date_1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date 2</label>
                <input
                  type="date"
                  value={formData.preferred_date_2}
                  onChange={(e) => setFormData({ ...formData, preferred_date_2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date 3</label>
                <input
                  type="date"
                  value={formData.preferred_date_3}
                  onChange={(e) => setFormData({ ...formData, preferred_date_3: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Emergency */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_emergency}
                onChange={(e) => setFormData({ ...formData, is_emergency: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Mark as emergency (requires immediate attention)
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || vehicles.length === 0}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Service Request'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
