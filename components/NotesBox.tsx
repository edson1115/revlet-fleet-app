'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';


export default function NotesBox({ requestId, canAdd = true }: { requestId: string; canAdd?: boolean }) {
const [items, setItems] = useState<{ id: string; body: string; created_at: string; author?: { email: string } }[]>([]);
const [text, setText] = useState('');
const [loading, setLoading] = useState(false);


async function load() {
try {
const res = await fetch(`/api/requests/${requestId}/notes`);
const json = await res.json();
if (!res.ok) throw new Error(json.error || 'Failed to load notes');
setItems(json.rows || []);
} catch (e: any) {
toast.error(e.message);
}
}


async function add() {
const body = text.trim();
if (!body) return;
try {
setLoading(true);
const res = await fetch(`/api/requests/${requestId}/notes`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ body }),
});
const json = await res.json();
if (!res.ok) throw new Error(json.error || 'Failed');
setText('');
await load();
toast.success('Note added');
} catch (e: any) {
toast.error(e.message);
} finally { setLoading(false); }
}


useEffect(() => { load(); }, [requestId]);


return (
<div className="border rounded-xl p-3 space-y-3 bg-white/50">
<div className="text-sm font-medium">Notes</div>
<div className="space-y-2 max-h-48 overflow-auto pr-1">
{items.map(n => (
<div key={n.id} className="text-sm border rounded p-2 bg-white">
<div className="opacity-70 text-xs">{new Date(n.created_at).toLocaleString()}</div>
<div>{n.body}</div>
</div>
))}
{!items.length && <div className="text-xs opacity-60">No notes yet.</div>}
</div>
{canAdd && (
<div className="flex gap-2">
<textarea
value={text}
onChange={(e) => setText(e.target.value)}
placeholder="Add a quick note for Office/Dispatch/Tech…"
className="flex-1 border rounded p-2 min-h-[60px]"
/>
<button onClick={add} disabled={loading} className="h-[60px] px-3 rounded bg-black text-white">{loading ? '…' : 'Add'}</button>
</div>
)}
</div>
);
}
