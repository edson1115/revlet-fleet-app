'use client';

import { useEffect, useMemo, useState } from 'react';
import { InviteUserButton } from '@/components/InviteUserButton';

/* =========================
   Types
========================= */
type IdOpt = { id: string; label: string };
type Technician = { id: string; label?: string | null };

type RequestRow = {
  id: string;
  status: string;
  service?: string | null;
  priority?: string | null;
  fmc?: string | null;
  mileage?: number | null;
  po?: string | null;
  notes?: string | null; // legacy single-notes field (kept for compatibility)
  created_at?: string | null;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  customer?: { id: string; name?: string | null } | null;
  vehicle?: {
    id?: string;
    unit_number?: string | null;
    year?: number | null;
    make?: string | null;
    model?: string | null;
    plate?: string | null;
  } | null;
  location?: { id?: string; name?: string | null } | null;
  technician?: { id: string | null } | null;
};

type RequestDetails = RequestRow & {
  // If your details route returns a notes array, use this:
  notes_list?: Array<{ id: string; text: string; created_at?: string | null }> | null;
};

/* =========================
   Helpers
========================= */
async function fetchJSON<T>(url: string) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` – ${text}` : ''}`);
  }
  return res.json() as Promise<T>;
}
async function patchJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` – ${text}` : ''}`);
  }
  return res.json() as Promise<T>;
}
async function postJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` – ${text}` : ''}`);
  }
  return res.json() as Promise<T>;
}
async function delJSON<T>(url: string) {
  const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` – ${text}` : ''}`);
  }
  return res.json() as Promise<T>;
}

function fmtVehicle(v?: RequestRow['vehicle']) {
  if (!v) return '—';
  const ymk = [v.year, v.make, v.model].filter(Boolean).join(' ');
  return v.unit_number || ymk || v.plate || v.id || '—';
}
function fmtDate(s?: string | null) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

/* =========================
   Page Component
========================= */
export default function OfficeQueuePage() {
  // Table + filters
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Drawer
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerRow, setDrawerRow] = useState<RequestDetails | null>(null);
  const [drawerErr, setDrawerErr] = useState('');
  const [drawerBusy, setDrawerBusy] = useState(false);

  // Editable fields inside drawer
  const [dStatus, setDStatus] = useState<string>('NEW');
  const [dService, setDService] = useState<string>('');
  const [dFmc, setDFmc] = useState<string>('');
  const [dPo, setDPo] = useState<string>('');
  const [dMileage, setDMileage] = useState<string>('');
  const [dScheduledAt, setDScheduledAt] = useState<string>(''); // ISO local datetime string (optional)

  // Notes
  const [notes, setNotes] = useState<Array<{ id: string; text: string; created_at?: string | null }>>([]);
  const [newNote, setNewNote] = useState('');
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteErr, setNoteErr] = useState('');

  // Status options for Office (adjust to your policy)
  const statusOptions = useMemo(
    () => [
      'NEW',
      'WAITING_APPROVAL',
      'WAITING_PARTS',
      'WAITING_TO_BE_SCHEDULED',
      'SCHEDULED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELED',
    ],
    []
  );

  // Load queue
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchJSON<{ rows: RequestRow[] }>('/api/requests?limit=50&sortBy=created_at&sortDir=desc');
        if (!mounted) return;
        setRows(data.rows || []);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e.message || 'Failed to load queue');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // When opening a row
  async function openDrawer(id: string) {
    setShowDrawer(true);
    setDrawerId(id);
    setDrawerErr('');
    setDrawerBusy(true);
    try {
      const data = await fetchJSON<RequestDetails>(`/api/requests/${encodeURIComponent(id)}`);
      setDrawerRow(data);

      // seed edit fields
      setDStatus(String(data.status || 'NEW'));
      setDService(String(data.service || ''));
      setDFmc(String(data.fmc || ''));
      setDPo(String(data.po || ''));
      setDMileage(data.mileage != null ? String(data.mileage) : '');
      setDScheduledAt(data.scheduled_at ? new Date(data.scheduled_at).toISOString().slice(0, 16) : '');

      // notes array if provided
      const n = (data.notes_list || []).map(n => ({ id: n.id, text: n.text, created_at: n.created_at ?? null }));
      setNotes(n);
      setNewNote('');
      setNoteErr('');
    } catch (e: any) {
      setDrawerErr(e.message || 'Failed to load details');
    } finally {
      setDrawerBusy(false);
    }
  }

  function closeDrawer() {
    if (drawerBusy || noteBusy) return;
    setShowDrawer(false);
    setDrawerId(null);
    setDrawerRow(null);
    setDrawerErr('');
  }

  // Save details (PATCH)
  async function saveDetails() {
    if (!drawerId) return;
    setDrawerBusy(true);
    setDrawerErr('');
    try {
      const body: any = {
        status: dStatus || null,
        service: dService || null,
        fmc: dFmc || null,
        po: dPo || null,
        mileage: dMileage ? Number(dMileage) : null,
      };
      // optional scheduled date if present (assumes local 'YYYY-MM-DDTHH:mm')
      if (dScheduledAt) {
        // send RFC 3339
        body.scheduled_at = new Date(dScheduledAt).toISOString();
      } else {
        body.scheduled_at = null;
      }

      const updated = await patchJSON<RequestDetails>(`/api/requests/${encodeURIComponent(drawerId)}`, body);
      setDrawerRow(updated);

      // also reflect in list
      setRows(prev =>
        prev.map(r => (r.id === drawerId ? { ...r, status: updated.status, service: updated.service, priority: updated.priority, fmc: updated.fmc, mileage: updated.mileage, po: updated.po, scheduled_at: updated.scheduled_at } : r))
      );
    } catch (e: any) {
      setDrawerErr(e.message || 'Update failed');
    } finally {
      setDrawerBusy(false);
    }
  }

  // Notes: add
  async function addNote() {
    if (!drawerId) return;
    const text = newNote.trim();
    if (!text) return;
    setNoteBusy(true);
    setNoteErr('');
    try {
      // support either /api/requests/[id]/notes or PATCH details with { add_note: "..." }
      // prefer dedicated notes route if you have it; else use PATCH with add_note
      let noteResp: { id: string; text: string; created_at?: string | null } | null = null;

      try {
        noteResp = await postJSON(`/api/requests/${encodeURIComponent(drawerId)}/notes`, { text });
      } catch {
        const d = await patchJSON<RequestDetails>(`/api/requests/${encodeURIComponent(drawerId)}`, { add_note: text });
        // expect latest note first if backend returns notes_list
        const latest = (d.notes_list || [])[0];
        if (latest) noteResp = { id: latest.id, text: latest.text, created_at: latest.created_at ?? null };
      }

      if (noteResp) {
        setNotes(prev => [{ id: noteResp.id, text: noteResp.text, created_at: noteResp.created_at ?? null }, ...prev]);
        setNewNote('');
      }
    } catch (e: any) {
      setNoteErr(e.message || 'Failed to add note');
    } finally {
      setNoteBusy(false);
    }
  }

  // Notes: delete
  async function removeNote(id: string) {
    if (!drawerId) return;
    setNoteBusy(true);
    setNoteErr('');
    try {
      // support either DELETE notes endpoint or PATCH with { remove_note_id }
      try {
        await delJSON(`/api/requests/${encodeURIComponent(drawerId)}/notes/${encodeURIComponent(id)}`);
      } catch {
        await patchJSON<RequestDetails>(`/api/requests/${encodeURIComponent(drawerId)}`, { remove_note_id: id });
      }
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (e: any) {
      setNoteErr(e.message || 'Failed to remove note');
    } finally {
      setNoteBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">Office Queue</h1>
        <InviteUserButton />
      </div>

      {loading ? (
        <div>Loading queue…</div>
      ) : err ? (
        <div className="text-red-600">Error: {err}</div>
      ) : rows.length === 0 ? (
        <div>No service requests found.</div>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-3 py-2">Customer</th>
              <th className="text-left px-3 py-2">Vehicle</th>
              <th className="text-left px-3 py-2">Service</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Priority</th>
              <th className="text-left px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => openDrawer(r.id)}
                title="View & edit request"
              >
                <td className="px-3 py-2">{r.customer?.name || '—'}</td>
                <td className="px-3 py-2">{fmtVehicle(r.vehicle)}</td>
                <td className="px-3 py-2">{r.service || '—'}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2">{r.priority || '—'}</td>
                <td className="px-3 py-2">{fmtDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ===== Drawer ===== */}
      {showDrawer ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end bg-black/40"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget && !drawerBusy && !noteBusy) closeDrawer(); }}
        >
          <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Request Details</h2>
              <button
                onClick={() => !drawerBusy && !noteBusy && closeDrawer()}
                className="px-3 py-1 border rounded"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {drawerErr ? (
              <div className="border border-red-300 bg-red-50 text-red-800 p-2 rounded mb-3">{drawerErr}</div>
            ) : null}

            {!drawerRow ? (
              <div>Loading…</div>
            ) : (
              <div className="space-y-6">
                {/* Top editable fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block text-sm">
                    <span className="block mb-1">Status</span>
                    <select
                      className="border rounded-md px-3 py-2 w-full"
                      value={dStatus}
                      onChange={(e) => setDStatus(e.target.value)}
                      disabled={drawerBusy}
                    >
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="block mb-1">Service</span>
                    <input
                      className="border rounded-md px-3 py-2 w-full"
                      value={dService}
                      onChange={(e) => setDService(e.target.value)}
                      disabled={drawerBusy}
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="block mb-1">FMC</span>
                    <input
                      className="border rounded-md px-3 py-2 w-full"
                      value={dFmc}
                      onChange={(e) => setDFmc(e.target.value)}
                      disabled={drawerBusy}
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="block mb-1">PO</span>
                    <input
                      className="border rounded-md px-3 py-2 w-full"
                      value={dPo}
                      onChange={(e) => setDPo(e.target.value)}
                      disabled={drawerBusy}
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="block mb-1">Mileage</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="border rounded-md px-3 py-2 w-full"
                      value={dMileage}
                      onChange={(e) => setDMileage(e.target.value)}
                      disabled={drawerBusy}
                      placeholder="Odometer"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="block mb-1">Scheduled (optional)</span>
                    <input
                      type="datetime-local"
                      className="border rounded-md px-3 py-2 w-full"
                      value={dScheduledAt}
                      onChange={(e) => setDScheduledAt(e.target.value)}
                      disabled={drawerBusy}
                    />
                  </label>
                </div>

                {/* Readonly context */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-sm">
                    <div className="text-gray-500">Created</div>
                    <div>{fmtDate(drawerRow.created_at)}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">Customer</div>
                    <div>{drawerRow.customer?.name || '—'}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">Location</div>
                    <div>{drawerRow.location?.name || '—'}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">Vehicle</div>
                    <div>{fmtVehicle(drawerRow.vehicle)}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">Technician</div>
                    <div>{drawerRow.technician?.id || '—'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button className="px-4 py-2 border rounded" onClick={closeDrawer} disabled={drawerBusy || noteBusy}>Close</button>
                  <button
                    className="px-4 py-2 bg-black text-white rounded disabled:opacity-40"
                    onClick={saveDetails}
                    disabled={drawerBusy || noteBusy}
                  >
                    {drawerBusy ? 'Saving…' : 'Save'}
                  </button>
                </div>

                {/* Notes */}
                <div className="pt-3">
                  <div className="text-base font-semibold mb-2">Notes</div>
                  {noteErr ? (
                    <div className="border border-amber-300 bg-amber-50 text-amber-800 p-2 rounded mb-2 text-sm">
                      {noteErr}
                    </div>
                  ) : null}

                  <div className="flex items-start gap-2 mb-3">
                    <textarea
                      className="border rounded-md px-3 py-2 w-full min-h-[80px]"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note…"
                      disabled={noteBusy}
                    />
                    <button
                      className="px-3 py-2 border rounded bg-black text-white disabled:opacity-40"
                      onClick={addNote}
                      disabled={noteBusy || !newNote.trim()}
                    >
                      {noteBusy ? 'Adding…' : 'Add'}
                    </button>
                  </div>

                  {notes.length === 0 ? (
                    <div className="text-sm text-gray-500">No notes yet.</div>
                  ) : (
                    <ul className="space-y-2">
                      {notes.map(n => (
                        <li key={n.id} className="border rounded-md p-3">
                          <div className="text-sm whitespace-pre-wrap">{n.text}</div>
                          <div className="text-xs text-gray-500 mt-1">{fmtDate(n.created_at)}</div>
                          <div className="mt-2">
                            <button
                              className="text-xs px-2 py-1 border rounded"
                              onClick={() => removeNote(n.id)}
                              disabled={noteBusy}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
