// components/NotesBox.tsx
'use client';

import { useEffect, useState } from 'react';

type Note = { id: string; text: string; created_at: string; author?: { email?: string } };

export default function NotesBox({
  requestId,
  canAdd = true,
}: {
  requestId: string;
  canAdd?: boolean;
}) {
  const [items, setItems] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function load() {
    setErr('');
    try {
      // GET returns an array: [{ id, text, created_at }, ...]
      const res = await fetch(`/api/requests/${requestId}/notes`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load notes');
      // Normalize and newest-first (API already orders desc, but keep it safe)
      const arr: Note[] = Array.isArray(json)
        ? json.map((n: any) => ({
            id: n.id,
            text: String(n.text ?? ''),
            created_at: n.created_at ?? new Date().toISOString(),
            author: n.author ?? undefined,
          }))
        : [];
      setItems(arr);
    } catch (e: any) {
      setErr(e.message || 'Failed to load notes');
    }
  }

  async function add() {
    const payload = text.trim();
    if (!payload) return;
    setLoading(true);
    setErr('');
    try {
      // API expects { text }
      const res = await fetch(`/api/requests/${requestId}/notes`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to add note');

      // Server returns the created note { id, text, created_at }
      const created: Note = {
        id: json.id,
        text: json.text,
        created_at: json.created_at ?? new Date().toISOString(),
      };

      // Optimistic prepend; or call load() if you prefer re-fetch
      setItems((prev) => [created, ...prev]);
      setText('');
    } catch (e: any) {
      setErr(e.message || 'Failed to add note');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  return (
    <div className="border rounded-xl p-3 space-y-3 bg-white/50">
      <div className="text-sm font-medium">Notes</div>

      {err ? (
        <div className="text-xs rounded border border-amber-300 bg-amber-50 text-amber-900 p-2">
          {err}
        </div>
      ) : null}

      <div className="space-y-2 max-h-48 overflow-auto pr-1">
        {items.map((n) => (
          <div key={n.id} className="text-sm border rounded p-2 bg-white">
            <div className="opacity-70 text-xs">
              {new Date(n.created_at).toLocaleString()}
            </div>
            <div className="whitespace-pre-wrap">{n.text}</div>
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
          <button
            onClick={add}
            disabled={loading || !text.trim()}
            className="h-[60px] px-3 rounded bg-black text-white disabled:opacity-40"
          >
            {loading ? '…' : 'Add'}
          </button>
        </div>
      )}
    </div>
  );
}
