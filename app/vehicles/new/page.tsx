// app/vehicles/new/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function Page() {
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get('from') || '/fm/requests/new';

  const [form, setForm] = useState({
    year: '' as string,
    make: '',
    model: '',
    unit_number: '',
    vin: '',
    plate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          year: form.year ? Number(form.year) : null,
          make: form.make.trim(),
          model: form.model.trim(),
          unit_number: form.unit_number.trim() || null,
          vin: form.vin.trim() || null,
          plate: form.plate.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to create vehicle');
      const id = json?.id as string;
      const url = new URL(from, window.location.origin);
      url.searchParams.set('vehicle_id', id);
      router.replace(url.pathname + url.search);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Add Vehicle</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Year</label>
            <input type="number" value={form.year} onChange={update('year')} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Unit #</label>
            <input type="text" value={form.unit_number} onChange={update('unit_number')} className="w-full border rounded p-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Make *</label>
            <input required type="text" value={form.make} onChange={update('make')} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Model *</label>
            <input required type="text" value={form.model} onChange={update('model')} className="w-full border rounded p-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">VIN</label>
            <input type="text" value={form.vin} onChange={update('vin')} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Plate</label>
            <input type="text" value={form.plate} onChange={update('plate')} className="w-full border rounded p-2" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="rounded bg-black text-white px-4 py-2">
            {submitting ? 'Saving…' : 'Save Vehicle'}
          </button>
          <button type="button" onClick={() => history.back()} className="rounded border px-4 py-2">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
