'use client';

import { useEffect, useMemo, useState } from 'react';

type Role = 'CUSTOMER'|'OFFICE'|'DISPATCH'|'TECH'|'ADMIN'|'FLEET_MANAGER';
type Req = { id: string; email: string; name: string | null; requested_role: Role; created_at: string };
type Dir = { id: string; email: string; name: string | null; role: Role; customer_id: string | null };
type Cust = { id: string; name: string };

export default function AdminAccessPage() {
  const [tab, setTab] = useState<'pending'|'directory'>('pending');
  const [loading, setLoading] = useState(true);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [dir, setDir] = useState<Dir[]>([]);
  const [customers, setCustomers] = useState<Cust[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const [ok, setOk] = useState<string|null>(null);

  async function loadAll() {
    setLoading(true); setErr(null); setOk(null);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch('/api/admin/access-requests', { cache: 'no-store' }),
        fetch('/api/admin/users', { cache: 'no-store' }),
        fetch('/api/customers?limit=500', { cache: 'no-store' }),
      ]);
      const j1 = await r1.json(); const j2 = await r2.json(); const j3 = await r3.json();
      if (!r1.ok) throw new Error(j1?.error || 'Failed to load requests');
      if (!r2.ok) throw new Error(j2?.error || 'Failed to load users');
      if (!r3.ok) throw new Error(j3?.error || 'Failed to load customers');
      setReqs(j1.rows || []);
      setDir(j2.rows || []);
      setCustomers((j3.rows || []).map((c: any) => ({ id: c.id, name: c.name })));
    } catch (e: any) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function approve(id: string, role: Role, customer_id?: string | null) {
    setErr(null); setOk(null);
    const res = await fetch('/api/admin/access-requests', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, role, customer_id: customer_id || null, invite: true }),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok) { setErr(j?.error || `Approve failed (${res.status})`); return; }
    setOk('Approved & invited.');
    await loadAll();
  }

  async function updateUser(id: string, role: Role, customer_id?: string | null) {
    setErr(null); setOk(null);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, role, customer_id: customer_id || null }),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok) { setErr(j?.error || `Update failed (${res.status})`); return; }
    setOk('User updated.');
    await loadAll();
  }

  const roleOptions: Role[] = ['CUSTOMER','OFFICE','DISPATCH','TECH','ADMIN','FLEET_MANAGER'];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin — Access</h1>

      <div className="flex gap-2">
        <button className={`btn ${tab==='pending'?'btn-primary':''}`} onClick={()=>setTab('pending')}>Pending requests</button>
        <button className={`btn ${tab==='directory'?'btn-primary':''}`} onClick={()=>setTab('directory')}>User directory</button>
      </div>

      {err && <div className="text-sm rounded bg-red-50 text-red-700 p-3">{err}</div>}
      {ok && <div className="text-sm rounded bg-green-50 text-green-700 p-3">{ok}</div>}

      {loading ? <div>Loading…</div> : (
        <>
          {tab === 'pending' && (
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th>Email</th><th>Requested</th><th>Created</th><th>Role</th><th>Customer</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reqs.length === 0 ? (
                    <tr><td colSpan={6} className="py-6 text-gray-500">No pending requests.</td></tr>
                  ) : reqs.map((r) => (
                    <RowApprove key={r.id} r={r} customers={customers} onApprove={approve} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'directory' && (
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th>Email</th><th>Name</th><th>Role</th><th>Customer</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dir.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-gray-500">No users yet.</td></tr>
                  ) : dir.map((u) => (
                    <RowUser key={u.id} u={u} customers={customers} roleOptions={roleOptions} onSave={updateUser} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RowApprove({
  r, customers, onApprove,
}: {
  r: { id: string; email: string; name: string | null; requested_role: Role; created_at: string };
  customers: { id: string; name: string }[];
  onApprove: (id: string, role: Role, customer_id?: string|null) => void;
}) {
  const [role, setRole] = useState<Role>(r.requested_role || 'CUSTOMER');
  const [cust, setCust] = useState<string>('');

  const requireCustomer = role === 'CUSTOMER';

  return (
    <tr className="border-b">
      <td className="py-2">{r.email}</td>
      <td>{r.requested_role}</td>
      <td>{new Date(r.created_at).toLocaleString()}</td>
      <td>
        <select className="input" value={role} onChange={(e)=>setRole(e.target.value as Role)}>
          {['CUSTOMER','OFFICE','DISPATCH','TECH','ADMIN','FLEET_MANAGER'].map(opt=>(
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </td>
      <td>
        <select className="input" value={cust} onChange={e=>setCust(e.target.value)}>
          <option value="">—</option>
          {customers.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </td>
      <td>
        <button
          className="btn btn-primary"
          onClick={()=>onApprove(r.id, role, requireCustomer ? (cust||undefined) : (cust||undefined))}
          disabled={requireCustomer && !cust}
        >
          Approve
        </button>
      </td>
    </tr>
  );
}

function RowUser({
  u, customers, roleOptions, onSave,
}: {
  u: { id: string; email: string; name: string | null; role: Role; customer_id: string | null };
  customers: { id: string; name: string }[];
  roleOptions: Role[];
  onSave: (id: string, role: Role, customer_id?: string|null) => void;
}) {
  const [role, setRole] = useState<Role>(u.role);
  const [cust, setCust] = useState<string>(u.customer_id || '');

  const requireCustomer = role === 'CUSTOMER';

  return (
    <tr className="border-b">
      <td className="py-2">{u.email}</td>
      <td>{u.name || '—'}</td>
      <td>
        <select className="input" value={role} onChange={(e)=>setRole(e.target.value as Role)}>
          {roleOptions.map(opt=> <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </td>
      <td>
        <select className="input" value={cust} onChange={e=>setCust(e.target.value)}>
          <option value="">—</option>
          {customers.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </td>
      <td>
        <button
          className="btn btn-primary"
          onClick={()=>onSave(u.id, role, requireCustomer ? (cust||undefined) : (cust||undefined))}
          disabled={requireCustomer && !cust}
        >
          Save
        </button>
      </td>
    </tr>
  );
}
