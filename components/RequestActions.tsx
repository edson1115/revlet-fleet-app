'use client';
import { useState } from 'react';
import { toast } from 'sonner';


export function RequestAction({ id, to, label, requirePO }: {
id: string; to: 'WAITING_APPROVAL'|'WAITING_PARTS'|'SCHEDULED'|'IN_PROGRESS'|'RESCHEDULED'|'CANCELED'|'COMPLETED';
label: string; requirePO?: boolean;
}) {
const [loading, setLoading] = useState(false);
async function run() {
try {
setLoading(true);
let po_number: string | undefined;
if (requirePO) {
po_number = prompt('Enter PO Number (required):') || undefined;
if (!po_number) { toast.error('PO is required'); setLoading(false); return; }
}
const res = await fetch(`/api/requests/${id}/transition`, {
method: 'PATCH',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ to, po_number }),
});
const json = await res.json();
if (!res.ok) throw new Error(json.error || 'Failed');
toast.success(`${label} ✓`);
if ('requestIdleCallback' in window) (window as any).requestIdleCallback(() => location.reload());
else location.reload();
} catch (e:any) {
toast.error(e.message);
} finally {
setLoading(false);
}
}
return (
<button
onClick={run}
disabled={loading}
className="px-3 py-2 rounded-xl shadow text-sm border hover:opacity-80 disabled:opacity-50"
>{loading ? 'Working…' : label}</button>
);
}



