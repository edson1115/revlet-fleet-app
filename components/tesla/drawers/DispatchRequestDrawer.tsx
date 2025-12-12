"use client";

import { useEffect, useState } from "react";

export function DispatchRequestDrawer({
  open,
  request,
  onClose,
  onChanged,
}: {
  open: boolean;
  request: any | null;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const [etaStart, setEtaStart] = useState("");
  const [etaEnd, setEtaEnd] = useState("");
  const [techs, setTechs] = useState<any[]>([]);
  const [techId, setTechId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) loadTechs();
    if (request) {
      setTechId(request.tech_id ?? "");
      setEtaStart(request.eta_start ?? "");
      setEtaEnd(request.eta_end ?? "");
    }
  }, [open, request]);

  async function loadTechs() {
    const res = await fetch("/api/techs?active=1", { cache: "no-store" });
    const js = await res.json();
    if (js.ok) setTechs(js.rows);
  }

  if (!open || !request) return null;

  async function schedule() {
    setBusy(true);
    const res = await fetch(`/api/dispatch/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "SCHEDULE",
        tech_id: techId,
        eta_start: etaStart,
        eta_end: etaEnd,
      }),
    });

    const js = await res.json();
    setBusy(false);

    if (!js.ok) {
      alert(js.error);
      return;
    }
    await onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose}></div>

      <div className="w-full sm:w-[480px] bg-white h-full shadow-xl p-6 overflow-y-auto animate-slideIn">
        <h2 className="text-xl font-semibold text-gray-900">
          Schedule Request
        </h2>

        <section className="mt-6">
          <h3 className="font-semibold">Assign Technician</h3>
          <select
            className="w-full border rounded-xl p-2 mt-2"
            value={techId}
            onChange={(e) => setTechId(e.target.value)}
          >
            <option value="">Select tech…</option>
            {techs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </section>

        <section className="mt-6">
          <h3 className="font-semibold">ETA Window</h3>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <input
              type="datetime-local"
              className="border rounded-xl p-2"
              value={etaStart}
              onChange={(e) => setEtaStart(e.target.value)}
            />
            <input
              type="datetime-local"
              className="border rounded-xl p-2"
              value={etaEnd}
              onChange={(e) => setEtaEnd(e.target.value)}
            />
          </div>
        </section>

        <button
          className="mt-8 w-full py-3 bg-gray-900 text-white rounded-xl hover:opacity-90"
          onClick={schedule}
          disabled={busy}
        >
          Schedule
        </button>

        <button
          className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
          onClick={onClose}
          disabled={busy}
        >
          Close
        </button>
      </div>
    </div>
  );
}
