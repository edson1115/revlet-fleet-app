import { supabaseServer } from '@/lib/supabaseServer';
import { RequestAction } from '@/components/RequestActions';
import NotesBox from '@/components/NotesBox';

export const dynamic = 'force-dynamic';

export default async function DispatchScheduledPage() {
  const sb = supabaseServer();
  const { data: rows, error } = await sb
    .from('service_requests')
    .select('id,status,vehicle_id,service,fmc,mileage,po_number,scheduled_at')
    .eq('status', 'SCHEDULED')
    .order('scheduled_at', { ascending: true });

  if (error) return <div className="p-6">Error: {error.message}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dispatch • SCHEDULED</h1>
      {!rows?.length && <div className="text-sm opacity-70">No SCHEDULED requests.</div>}
      <div className="grid gap-4">
        {rows?.map((r) => (
          <div key={r.id} className="rounded-2xl border p-4 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Request #{r.id.slice(0,8)}</div>
              <div className="text-xs rounded-full border px-2 py-1">{r.status}</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
              <div><span className="opacity-60">Service:</span> {r.service}</div>
              <div><span className="opacity-60">Mileage:</span> {r.mileage ?? '—'}</div>
              <div><span className="opacity-60">FMC:</span> {r.fmc ?? '—'}</div>
              <div><span className="opacity-60">PO:</span> {r.po_number ?? '—'}</div>
            </div>
            <div className="flex gap-2 mb-3">
              <RequestAction id={r.id} to="IN_PROGRESS" label="Mark In Progress" />
            </div>
            <NotesBox requestId={r.id} canAdd />
          </div>
        ))}
      </div>
    </div>
  );
}
