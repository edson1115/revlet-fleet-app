import { supabaseServer } from '@/lib/supabaseServer';
import { statusLabel } from '@/lib/status';
import NotesBox from '@/components/NotesBox';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function vehicleLabel(v?: {
  year: number | null; make: string | null; model: string | null;
  unit_number?: string | null; plate?: string | null;
}) {
  if (!v) return '—';
  const base = [v.year, v.make, v.model].filter(Boolean).join(' ');
  const extras = [v.unit_number ? `#${v.unit_number}` : null, v.plate ? `(${v.plate})` : null]
    .filter(Boolean).join(' ');
  return [base || '—', extras].filter(Boolean).join(' ');
}

export default async function OfficeRequestDetail({ params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { data: r, error } = await sb
    .from('service_requests')
    .select(`
      id,status,service,fmc,mileage,po_number,created_at,scheduled_at,started_at,completed_at,
      vehicle:vehicles(id,year,make,model,unit_number,plate)
    `)
    .eq('id', params.id)
    .single();

  if (error || !r) return <div className="p-6">Not found</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="text-sm">
        <Link href="/office/queue" className="text-blue-600 hover:underline">← Back to Office queue</Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Request #{r.id.slice(0, 8)}</h1>
        <div className="text-xs rounded-full border px-2 py-1">{statusLabel(r.status)}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h2 className="font-semibold mb-2">Details</h2>
          <div className="space-y-1 text-sm">
            <div><span className="opacity-60">Vehicle:</span> {vehicleLabel((r as any).vehicle)}</div>
            <div><span className="opacity-60">Service:</span> {r.service}</div>
            <div><span className="opacity-60">Mileage:</span> {r.mileage ?? '—'}</div>
            <div><span className="opacity-60">FMC:</span> {r.fmc ?? '—'}</div>
            <div><span className="opacity-60">PO:</span> {r.po_number ?? '—'}</div>
          </div>
        </div>

        <div className="rounded-2xl border p-4 bg-white shadow-sm md:col-span-2">
          <h2 className="font-semibold mb-2">Timeline</h2>
          <div className="text-sm grid gap-1">
            <div><span className="opacity-60">Created:</span> {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</div>
            <div><span className="opacity-60">Scheduled:</span> {r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : '—'}</div>
            <div><span className="opacity-60">Started:</span> {r.started_at ? new Date(r.started_at).toLocaleString() : '—'}</div>
            <div><span className="opacity-60">Completed:</span> {r.completed_at ? new Date(r.completed_at).toLocaleString() : '—'}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4 bg-white shadow-sm">
        <NotesBox requestId={r.id} canAdd />
      </div>
    </div>
  );
}
