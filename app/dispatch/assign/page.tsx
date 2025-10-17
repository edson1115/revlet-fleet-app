// app/dispatch/assign/page.tsx
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Id = string;
type Tech = { id: Id; name: string; market?: string | null };
type Vehicle = {
  year: number | null;
  make: string | null;
  model: string | null;
  plate?: string | null;
  unit_number?: string | null;
};
type Request = {
  id: Id;
  status: string;
  service: string | null;
  fmc: string | null;
  mileage: number | null;
  po: string | null;
  notes: string | null;
  scheduled_at?: string | null;
  location?: { name: string | null } | null;
  customer?: { name: string | null } | null;
  vehicle?: Vehicle | null;
};

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (iso?: string | null) => {
  const d = iso ? new Date(iso) : new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};
const vehicleLabel = (v?: Vehicle | null) =>
  v ? [v.year || "", v.make || "", v.model || "", v.plate || v.unit_number].filter(Boolean).join(" ") : "—";

export default function DispatchAssignPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const id = sp.get("id") || "";

  const [req, setReq] = useState<Request | null>(null);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [when, setWhen] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selected, setSelected] = useState<Id[]>([]);
  const [err, setErr] = useState<string>("");
  const [ok, setOk] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Load the request
  useEffect(() => {
    (async () => {
      try {
        setErr("");
        const res = await fetch(`/api/requests/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        const r: Request = json.request;
        setReq(r);
        setNotes(r?.notes || "");
        setWhen(toLocalInput(r?.scheduled_at));
      } catch (e: any) {
        setErr(e?.message || "Failed to load request.");
      }
    })();
  }, [id]);

  // Load techs for this market
  const market = useMemo(() => req?.location?.name || "", [req]);
  useEffect(() => {
    (async () => {
      if (!market) return;
      try {
        const res = await fetch(`/api/techs?market=${encodeURIComponent(market)}`, { cache: "no-store" });
        const json = await res.json();
        setTechs((json?.rows ?? []) as Tech[]);
      } catch {
        setTechs([]);
      }
    })();
  }, [market]);

  function toggleTech(tid: Id) {
    setSelected((prev) => {
      if (prev.includes(tid)) return prev.filter((x) => x !== tid);
      if (prev.length >= 5) return prev; // max 5 techs
      return [...prev, tid];
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setOk(false);
    if (!id) return setErr("Missing request id.");
    if (!when) return setErr("Choose a date & time.");
    if (selected.length === 0) return setErr("Pick at least one tech.");

    startTransition(async () => {
      try {
        const res = await fetch("/api/dispatch/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, when, notes, tech_ids: selected }),
        });
        if (!res.ok) throw new Error(await res.text());
        setOk(true);
        router.replace("/dispatch/scheduled?success=1");
      } catch (e: any) {
        setErr(e?.message || "Failed to assign.");
      }
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Dispatch Assignment</h1>
      {err && <div className="mb-3 rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">{err}</div>}
      {ok  && <div className="mb-3 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-2 text-sm">Assigned.</div>}

      {!req ? (
        <div className="text-sm text-gray-500">Loading request…</div>
      ) : (
        <form onSubmit={submit} className="grid md:grid-cols-12 gap-6">
          {/* LEFT: request details & scheduling */}
          <div className="md:col-span-6 space-y-3">
            <div className="rounded-2xl border p-4">
              <div className="text-sm"><span className="font-medium">Customer:</span> {req.customer?.name || "—"}</div>
              <div className="text-sm"><span className="font-medium">Vehicle:</span> {vehicleLabel(req.vehicle)}</div>
              <div className="text-sm"><span className="font-medium">Service:</span> {req.service || "—"}</div>
              <div className="text-sm"><span className="font-medium">Market:</span> {market || "—"}</div>
              <div className="text-sm"><span className="font-medium">PO:</span> {req.po || "—"}</div>
            </div>

            <div className="rounded-2xl border p-4 space-y-2">
              <label className="block text-sm">Date & time</label>
              <input
                type="datetime-local"
                className="w-full border rounded px-3 py-2"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                required
              />
            </div>

            <div className="rounded-2xl border p-4 space-y-2">
              <label className="block text-sm">Notes (editable)</label>
              <textarea
                className="w-full border rounded px-3 py-2"
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any dispatch notes for the technician…"
              />
            </div>
          </div>

          {/* RIGHT: tech pickers */}
          <div className="md:col-span-6">
            <div className="rounded-2xl border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Choose technicians</h3>
                <span className="text-xs text-gray-500">{selected.length} / 5</span>
              </div>

              {techs.length === 0 ? (
                <div className="text-sm text-gray-500">No techs for {market || "—"}.</div>
              ) : (
                <ul className="space-y-2">
                  {techs.map((t) => {
                    const on = selected.includes(t.id);
                    return (
                      <li key={t.id} className="flex items-center justify-between rounded border px-3 py-2">
                        <div className="text-sm">{t.name}</div>
                        <button
                          type="button"
                          onClick={() => toggleTech(t.id)}
                          className={`text-xs rounded px-2 py-1 border ${on ? "bg-gray-900 text-white" : "bg-white"}`}
                        >
                          {on ? "Selected" : "Select"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={isPending || !when || selected.length === 0}
                  className="px-4 py-2 rounded bg-black text-white hover:opacity-80 disabled:opacity-60"
                >
                  {isPending ? "Assigning…" : "Dispatch"}
                </button>
                <a href="/dispatch/scheduled" className="px-4 py-2 rounded border">Cancel</a>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
