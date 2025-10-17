// app/fm/requests/new/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';

/* ----------------------------- Server Action ----------------------------- */
export async function createRequestAction(formData: FormData) {
  'use server';

  const sb = await supabaseServer();

  const customer_id = String(formData.get('customer_id') || '');
  const location_id = String(formData.get('location_id') || '');
  const vehicle_id = String(formData.get('vehicle_id') || '');
  const service = String(formData.get('service') || '').trim();
  const fmc = (formData.get('fmc') ? String(formData.get('fmc')) : null) as string | null;

  const mileageRaw = formData.get('mileage');
  const mileage =
    typeof mileageRaw === 'string' && mileageRaw.length ? Number(mileageRaw) : null;

  const payload = {
    customer_id,
    location_id,
    vehicle_id,
    service, // enum: service_type
    fmc,     // enum: fmc
    mileage, // integer or null
  };

  const { error } = await sb.from('service_requests').insert(payload);
  if (error) throw new Error(error.message || 'Failed to create request');

  redirect('/office/queue');
}

/* ------------------------------ Page (RSC) ------------------------------- */
export default async function NewServiceRequestPage() {
  const sb = await supabaseServer();

  // Fetch each list, then coalesce to [] so map/length are safe.
  const customersRes = await sb.from('customers').select('id,name').order('name');
  const locationsRes = await sb.from('locations').select('id,name').order('name');
  const vehiclesRes  = await sb.from('vehicles').select('id,display_name').order('display_name');

  const customers = customersRes.data ?? [];
  const locations = locationsRes.data ?? [];
  const vehicles  = vehiclesRes.data  ?? [];

  // (Optional) If you want to surface fetch errors during development:
  // if (customersRes.error) console.error('customers error', customersRes.error);
  // if (locationsRes.error) console.error('locations error', locationsRes.error);
  // if (vehiclesRes.error)  console.error('vehicles error', vehiclesRes.error);

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">Create Service Request</h1>

      <form action={createRequestAction} className="space-y-4 rounded-xl border p-5 bg-white">
        {/* Customer */}
        <div>
          <label className="block mb-1 font-medium">Customer</label>
          <select name="customer_id" className="w-full rounded-md border p-2" required defaultValue="">
            <option value="" disabled>Select customer...</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block mb-1 font-medium">Location</label>
          <select name="location_id" className="w-full rounded-md border p-2" required defaultValue="">
            <option value="" disabled>Select location...</option>
            {locations.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Vehicle + Add link */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="font-medium">Vehicle</label>
            <Link href="/vehicles/new" className="text-sm underline">+ Add vehicle</Link>
          </div>
          <select name="vehicle_id" className="w-full rounded-md border p-2" required defaultValue="">
            <option value="" disabled>Select vehicle...</option>
            {vehicles.length > 0 ? (
              vehicles.map((v: any) => (
                <option key={v.id} value={v.id}>{v.display_name}</option>
              ))
            ) : (
              <option disabled value="">
                No vehicles found — use “+ Add vehicle”
              </option>
            )}
          </select>
        </div>

        {/* Service Type (enum) */}
        <div>
          <label className="block mb-1 font-medium">Service Type (enum)</label>
          <input
            name="service"
            placeholder="e.g., OIL_CHANGE"
            className="w-full rounded-md border p-2"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            This must match one of your database enum labels for <code>service_type</code>.
          </p>
        </div>

        {/* FMC */}
        <div>
          <label className="block mb-1 font-medium">FMC</label>
          <select name="fmc" className="w-full rounded-md border p-2" defaultValue="">
            <option value="">—</option>
            {/* Example enum labels; adjust to your DB’s fmc enum */}
            <option value="ARI">ARI</option>
            <option value="ELEMENT">ELEMENT</option>
            <option value="WHEELS">WHEELS</option>
          </select>
        </div>

        {/* Mileage */}
        <div>
          <label className="block mb-1 font-medium">Mileage</label>
          <input
            name="mileage"
            type="number"
            min={0}
            placeholder="e.g., 72345"
            className="w-full rounded-md border p-2"
          />
        </div>

        <button className="rounded-md bg-black px-4 py-2 text-white hover:bg-black/90">
          Create Request
        </button>
      </form>
    </div>
  );
}
