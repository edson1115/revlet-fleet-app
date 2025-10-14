// app/fm/requests/new/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Vehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  unit_number?: string | null;
  // if your vehicles table has this, we use it to filter for CUSTOMER role
  customer_id?: string | null;
};
type Location = { id: string; name: string };
type Customer = { id: string; name: string };
type Mini = {
  id: string;
  status: string;
  vehicle_id: string | null;
  service_type?: string | null;
  created_at?: string | null;
};
type Me = {
  authenticated: boolean;
  role: 'CUSTOMER' | 'OFFICE' | 'DISPATCH' | 'TECH';
  customer_id: string | null;
};

async function safeJson<T = any>(res: Response): Promise<T | null> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default function NewRequestPage() {
  const router = useRouter();

  const [me, setMe] = useState<Me | null>(null);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recent, setRecent] = useState<Mini[]>([]);
  const [vehiclesById, setVehiclesById] = useState<Record<string, Vehicle>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    vehicle_id: '',
    location_id: '',
    customer_id: '',
    service_type: 'Oil Change',
  });

  // Who am I?
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/me', { cache: 'no-store' });
      const j = await safeJson<Me>(res);
      if (j) {
        setMe(j);
        // lock customer for CUSTOMER role
        if (j.role === 'CUSTOMER' && j.customer_id) {
          setForm((f) => ({ ...f, customer_id: j.customer_id! }));
        }
      } else {
        setMe({ authenticated: false, role: 'OFFICE', customer_id: null });
      }
    })();
  }, []);

  // Lookups (after we know who the user is, to filter vehicles if needed)
  useEffect(() => {
    if (!me) return;
    (async () => {
      const res = await fetch('/api/lookups', { cache: 'no-store' });
      const j = await safeJson<{ vehicles: Vehicle[]; locations: Location[]; customers: Customer[] }>(res);
      if (!j) return;

      const allV = j.vehicles || [];
      const filtered =
        me.role === 'CUSTOMER' && me.customer_id
          ? allV.filter((v) => (v.customer_id ?? null) === me.customer_id)
          : allV;

      setVehicles(filtered);
      setLocations(j.locations || []);
      setCustomers(j.customers || []);
    })();
  }, [me]);

  // Recent list when a customer is selected
  useEffect(() => {
    if (!form.customer_id) {
      setRecent([]);
      setVehiclesById({});
      return;
    }
    (async () => {
      const res = await fetch(`/api/requests?customer_id=${form.customer_id}&limit=10`, { cache: 'no-store' });
      const j = await safeJson<{ rows: Mini[]; vehiclesById: Record<string, Vehicle> }>(res);
      setRecent(j?.rows || []);
      setVehiclesById(j?.vehiclesById || {});
    })();
  }, [form.customer_id]);

  const canSubmit = useMemo(
    () => !!form.vehicle_id && !!form.customer_id && !!form.service_type,
    [form.vehicle_id, form.customer_id, form.service_type]
  );

  function vlabel(v?: Vehicle) {
    if (!v) return '—';
    return `${v.year} ${v.make} ${v.model}${v.unit_number ? ` (${v.unit_number})` : ''}`;
  }

  async function submit() {
    if (!canSubmit) {
      setErr('Please select a vehicle and a customer before creating the request.');
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.replace('/office/queue?created=1');
    } else {
      const j = await safeJson<any>(res);
      setErr(j?.error || `Failed to create request (HTTP ${res.status})`);
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 p-6">
      <div>
        <h1 className="text-2xl font-semibold mb-4">New Service Request</h1>
        {err && <div className="mb-3 rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}

        {/* Vehicle */}
        <label className="block text-sm font-medium mb-1">Vehicle</label>
        <select
          required
          className="w-full border rounded px-3 py-2 mb-3"
          value={form.vehicle_id}
          onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
        >
          <option value="">Select vehicle…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.year} {v.make} {v.model}
              {v.unit_number ? ` (${v.unit_number})` : ''}
            </option>
          ))}
        </select>
        {!form.vehicle_id && <p className="text-xs text-red-600 -mt-2 mb-2">Vehicle is required.</p>}

        {/* Location */}
        <label className="block text-sm font-medium mb-1">Location</label>
        <select
          className="w-full border rounded px-3 py-2 mb-3"
          value={form.location_id}
          onChange={(e) => setForm({ ...form, location_id: e.target.value })}
        >
          <option value="">Select location…</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        {/* Customer (hidden/locked for CUSTOMER role) */}
        {me?.role === 'CUSTOMER' ? (
          <input type="hidden" value={form.customer_id} />
        ) : (
          <>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <select
              required
              className="w-full border rounded px-3 py-2 mb-3"
              value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {!form.customer_id && <p className="text-xs text-red-600 -mt-2 mb-2">Customer is required.</p>}
          </>
        )}

        {/* Service type */}
        <label className="block text-sm font-medium mb-1">Service</label>
        <input
          className="w-full border rounded px-3 py-2 mb-4"
          value={form.service_type}
          onChange={(e) => setForm({ ...form, service_type: e.target.value })}
        />

        <button
          onClick={submit}
          disabled={busy || !canSubmit}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Create Request'}
        </button>
      </div>

      {/* Recent for this customer */}
      <div className="bg-white border rounded-lg p-4">
        <div className="font-semibold mb-2">Recent for this customer</div>
        {(!form.customer_id || recent.length === 0) ? (
          <div className="text-sm text-gray-600">Pick a customer to see the last 10 requests.</div>
        ) : (
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{r.service_type ?? 'Service'}</div>
                  <div className="text-gray-600">
                    {vlabel(r.vehicle_id ? vehiclesById[r.vehicle_id] : undefined)}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-gray-100">{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
