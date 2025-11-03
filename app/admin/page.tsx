'use client';

import { useEffect, useState } from 'react';

type Tech = { id: string; name: string; active?: boolean | null };

async function fetchJSON<T>(url: string) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error((await res.text().catch(()=>'')).trim() || `GET ${url} failed`);
  return res.json() as Promise<T>;
}
async function postJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.text().catch(()=>'')).trim() || `POST ${url} failed`);
  return res.json() as Promise<T>;
}
async function delJSON<T>(url: string) {
  const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error((await res.text().catch(()=>'')).trim() || `DELETE ${url} failed`);
  return res.json() as Promise<T>;
}

export default function AdminTechsPage() {
  const [rows, setRows] = useState<Tech[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');

  async function refresh() {
    setErr('');
    const data = await fetchJSON<{ rows: { id: string; name: string }[] }>('/api/techs?active=1');
    setRows((data.rows || []).map(r => ({ id: r.id, name: r.name || 'Tech' })));
  }

  useEffect(() => {
    refresh().catch(e => setErr(e.message || 'Failed to load techs'));
  }, []);

  async function addTech() {
    const n = name.trim();
    if (!n) return;
    setBusy(true); setErr(''); setToast('');
    try {
      await postJSON('/api/techs', { name: n, active: true });
      setName('');
      setToast('Technician added.');
      await refresh();
    } catch (e: any) {
      setErr(e?.message || 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  async function removeTech(id: string) {
    setBusy(true); setErr(''); setToast('');
    try {
      await delJSON(`/api/techs?id=${encodeURIComponent(id)}`);
      setToast('Technician removed.');
      await refresh();
    } catch (e: any) {
      setErr(e?.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Technicians</h1>
      </div>

      {err ? (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-800 p-3 text-sm">{err}</div>
      ) : null}
      {toast ? (
        <div className="rounded-md border border-green-300 bg-green-50 text-green-800 p-3 text-sm">{toast}</div>
      ) : null}

      <div className="flex gap-2">
        <input
          className="border rounded-md px-3 py-2"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
        <button
          className="px-4 py-2 rounded-md border bg-black text-white disabled:opacity-40"
          onClick={addTech}
          disabled={busy || !name.trim()}
        >
          {busy ? 'Adding…' : 'Add'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-gray-50">
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3 w-28"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="py-4 px-3 text-gray-500" colSpan={2}>No technicians yet.</td></tr>
            ) : rows.map(t => (
              <tr key={t.id} className="border-b">
                <td className="py-2 px-3">{t.name}</td>
                <td className="py-2 px-3">
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => removeTech(t.id)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
