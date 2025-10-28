'use client';

import { useState } from 'react';

export function InviteUserButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [customerId, setCustomerId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function sendInvite() {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const res = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role,
          customer_id: customerId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Invite failed');
      setMsg('✅ Invitation sent successfully.');
      setEmail('');
      setRole('CUSTOMER');
      setCustomerId('');
      setOpen(false);
    } catch (e: any) {
      setErr(e.message || 'Failed to send invite.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border rounded-md bg-black text-white px-3 py-2 hover:bg-gray-800"
      >
        + Invite User
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Invite User</h2>
              <button
                className="px-3 py-1 border rounded-md"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            {err && (
              <div className="text-sm border border-red-300 bg-red-50 text-red-800 p-2 rounded">
                {err}
              </div>
            )}
            {msg && (
              <div className="text-sm border border-green-300 bg-green-50 text-green-800 p-2 rounded">
                {msg}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm">
                <span className="block mb-1">Email</span>
                <input
                  type="email"
                  className="border rounded-md px-3 py-2 w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  disabled={busy}
                />
              </label>

              <label className="block text-sm">
                <span className="block mb-1">Role</span>
                <select
                  className="border rounded-md px-3 py-2 w-full"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={busy}
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="OFFICE">OFFICE</option>
                  <option value="DISPATCHER">DISPATCHER</option>
                  <option value="TECH">TECH</option>
                </select>
              </label>

              {role === 'CUSTOMER' && (
                <label className="block text-sm">
                  <span className="block mb-1">Customer ID (optional)</span>
                  <input
                    className="border rounded-md px-3 py-2 w-full"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="(auto-detect if blank)"
                    disabled={busy}
                  />
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 border rounded-md"
                disabled={busy}
              >
                Cancel
              </button>
              <button
                onClick={sendInvite}
                className="px-4 py-2 bg-black text-white rounded-md disabled:opacity-40"
                disabled={busy || !email}
              >
                {busy ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
