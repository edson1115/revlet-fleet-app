// app/office/queue/page.tsx
import { supabaseServer } from '@/lib/supabaseServer';

export default async function OfficeQueuePage() {
  const sb = await supabaseServer(); // ← await!

  const { data: rows, error } = await sb
    .from('service_requests')
    // alias service_type → service so UI can keep using "service"
    .select('id,status,vehicle_id,service:service_type,fmc,mileage,po_number,created_at')
    .eq('status', 'NEW')
    .order('created_at', { ascending: true });

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-4">Office Queue</h1>
        <div className="rounded border bg-red-50 p-4 text-red-700">
          Failed to load queue: {error.message}
        </div>
      </main>
    );
  }

  const items = Array.isArray(rows) ? rows : [];

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Office Queue</h1>
      {items.length === 0 ? (
        <div className="text-slate-600">No NEW requests.</div>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Vehicle</th>
                <th className="px-3 py-2 text-left">Service</th>
                <th className="px-3 py-2 text-left">FMC</th>
                <th className="px-3 py-2 text-left">Mileage</th>
                <th className="px-3 py-2 text-left">PO #</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{r.vehicle_id}</td>
                  <td className="px-3 py-2">{r.service}</td>
                  <td className="px-3 py-2">{r.fmc ?? '—'}</td>
                  <td className="px-3 py-2">{r.mileage ?? '—'}</td>
                  <td className="px-3 py-2">{r.po_number ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
