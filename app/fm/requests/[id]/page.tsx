import { supabaseServer } from '@/lib/supabaseServer';
import NotesBox from '@/components/NotesBox';


export default async function Page({ params }: { params: { id: string } }) {
const sb = supabaseServer();
const { data: row, error } = await sb
.from('service_requests')
.select('id, status, vehicle_id, service, fmc, mileage, created_at')
.eq('id', params.id)
.single();
if (error || !row) return <div className="p-6">Not found</div>;


return (
<div className="p-6 space-y-6">
<h1 className="text-xl font-semibold">Request #{row.id.slice(0,8)}</h1>
<div className="grid gap-2 text-sm">
<div>Status: {row.status}</div>
<div>Service: {row.service}</div>
<div>Mileage: {row.mileage ?? '—'}</div>
<div>FMC: {row.fmc ?? '—'}</div>
</div>


{/* Read‑only notes for Customers */}
<NotesBox requestId={row.id} canAdd={false} />
</div>
);
}