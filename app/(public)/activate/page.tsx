'use client';

import { useState } from 'react';

export default function ActivatePage() {
  const [form, setForm] = useState({ name: '', email: '', company_name: '', requested_role: 'CUSTOMER', note: '' });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setMsg(null);
    const res = await fetch('/api/access-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMsg('Thanks! We’ve received your request. We’ll email you once it’s approved.');
      setForm({ name: '', email: '', company_name: '', requested_role: 'CUSTOMER', note: '' });
    } else {
      const j = await res.json().catch(() => null);
      setMsg(j?.error || `Failed (${res.status})`);
    }
    setBusy(false);
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Request Access</h1>

      {msg && <div className="mb-3 rounded bg-gray-100 px-3 py-2 text-sm">{msg}</div>}

      <label className="block text-sm font-medium mb-1">Full name</label>
      <input className="input mb-3" value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} />

      <label className="block text-sm font-medium mb-1">Work email</label>
      <input type="email" className="input mb-3" value={form.email} onChange={(e)=>setForm(f=>({...f,email:e.target.value}))} />

      <label className="block text-sm font-medium mb-1">Company</label>
      <input className="input mb-3" value={form.company_name} onChange={(e)=>setForm(f=>({...f,company_name:e.target.value}))} />

      <label className="block text-sm font-medium mb-1">Role</label>
      <select className="select mb-3" value={form.requested_role} onChange={(e)=>setForm(f=>({...f,requested_role:e.target.value}))}>
        <option value="CUSTOMER">Customer</option>
        <option value="OFFICE">Office</option>
        <option value="DISPATCH">Dispatch</option>
        <option value="TECH">Tech</option>
      </select>

      <label className="block text-sm font-medium mb-1">Notes (optional)</label>
      <textarea className="textarea mb-4" rows={3} value={form.note} onChange={(e)=>setForm(f=>({...f,note:e.target.value}))}/>

      <button onClick={submit} disabled={busy} className="btn btn-primary">{busy ? 'Submitting…' : 'Request access'}</button>
    </div>
  );
}



