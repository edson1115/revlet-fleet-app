// components/InviteUserButton.tsx
'use client';

import { useEffect, useState } from 'react';

type IdLabel = { id: string; label: string };

async function getJSON<T>(url: string) {
  const r = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as T;
}
async function postJSON<T>(url: string, body: any) {
  const r = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as T;
}

export function InviteUserButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CUSTOMER'|'OFFICE'|'DISPATCHER'|'TECH'|'ADMIN'>('CUSTOMER');

  const [locations, setLocations] = useState<IdLabel[]>([]);
  const [locationId, setLocationId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    if (!open) return;
    let live = true;
    (async () => {
      try {
        const res = await getJSON<{ ok: boolean; data: IdLabel[] }>('/api/lookups?scope=locations');
        if (!live) return;
        setLocations(res.data || []);
      } catch (e: any) {
        if (!live) return;
        setErr(e.message || 'Failed to load locations.');
      }
    })();
    return () => { live = false; };
  }, [open]);

  async function submit() {
    setErr(''); setOk(''); setBusy(true);
    try {
      const body: any = {
        email: email.trim().toLowerCase(),
        role,
        name: name.trim() || null,
        location_id: locationId || null,
      };
      if (role === 'CUSTOMER') {
        body.customer_id = customerId || null;
        body.customer_name = customerName || null;
      }
      const r = await postJSON('/api/admin/invite-user', body);
      setOk('Invite sent.');
      setEmail(''); setName(''); setCustomerId(''); setCustomerName(''); setLocationId('');
    } catch (e: any) {
      setErr(e.message || 'Invite failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="border px-3 py-2 rounded" onClick={() => setOpen(true)}>+ Invite User</button>
      {!open ? null : (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4" onClick={(e)=>{ if(e.target===e.currentTarget) setOpen(false) }}>
          <div className="w-full max-w-lg bg-white rounded shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Invite User</h2>
              <button className="border px-2 py-1 rounded" onClick={()=>setOpen(false)}>✕</button>
            </div>

            {err ? <div className="rounded border border-red-200 bg-red-50 text-red-700 p-2 mb-3">{err}</div> : null}
            {ok ? <div className="rounded border border-green-200 bg-green-50 text-green-700 p-2 mb-3">{ok}</div> : null}

            <div className="space-y-3">
              <label className="text-sm block">
                <span className="block mb-1">Email</span>
                <input className="w-full rounded border px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
              </label>

              <label className="text-sm block">
                <span className="block mb-1">Full Name (optional)</span>
                <input className="w-full rounded border px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
              </label>

              <label className="text-sm block">
                <span className="block mb-1">Role</span>
                <select className="w-full rounded border px-3 py-2" value={role} onChange={e=>setRole(e.target.value as any)}>
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="OFFICE">OFFICE</option>
                  <option value="DISPATCHER">DISPATCHER</option>
                  <option value="TECH">TECH</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>

              {/* Location scoping (optional now; required by your process) */}
              <label className="text-sm block">
                <span className="block mb-1">Location (market)</span>
                <select className="w-full rounded border px-3 py-2" value={locationId} onChange={e=>setLocationId(e.target.value)}>
                  <option value="">Select…</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </label>

              {/* Customer only for CUSTOMER role; choose one method */}
              {role === 'CUSTOMER' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="text-sm block">
                    <span className="block mb-1">Customer ID (if existing)</span>
                    <input className="w-full rounded border px-3 py-2" value={customerId} onChange={e=>setCustomerId(e.target.value)} />
                  </label>
                  <label className="text-sm block">
                    <span className="block mb-1">Customer Name (new)</span>
                    <input className="w-full rounded border px-3 py-2" value={customerName} onChange={e=>setCustomerName(e.target.value)} />
                  </label>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button className="border px-3 py-2 rounded" onClick={()=>setOpen(false)} disabled={busy}>Cancel</button>
                <button className="px-3 py-2 rounded bg-black text-white disabled:opacity-50" onClick={submit} disabled={busy}>
                  {busy ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
