'use client';

import { useEffect, useState } from 'react';

type Row = {
  id: string;
  status: string;
  service?: string | null;
  created_at?: string;
  scheduled_at?: string | null;
};

export default function CustomerMyRequestsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean>(true); // assume authed, correct after fetch
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch("/api/requests?mine=1&limit=100&sortBy=created_at&sortDir=desc", {
          credentials: "include",
        });
        if (res.status === 401) {
          // With updated API this shouldn't happen, but handle anyway
          if (live) {
            setAuthed(false);
            setRows([]);
          }
          return;
        }
        if (!res.ok) {
          const t = await res.text().catch(()=>"");
          throw new Error(t || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (live) {
          setAuthed(true); // if API returned 200, we don't know for sure—but treat as fine
          setRows(data?.rows ?? []);
        }
      } catch (e:any) {
        if (live) setErr(e?.message || "Failed to load requests.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Requests</h1>

      {!authed ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm">
          You’re browsing as <b>Guest</b>. Sign in to view your requests tied to your account.
        </div>
      ) : null}

      {err ? (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-gray-600 animate-pulse">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-600">No requests yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Service</th>
                <th className="py-2 pr-4">Scheduled</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 pr-4">{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</td>
                  <td className="py-2 pr-4">{r.status}</td>
                  <td className="py-2 pr-4">{r.service ?? "—"}</td>
                  <td className="py-2 pr-4">{r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
