"use client";

import { useEffect, useState } from "react";
import { TeslaTimeline } from "@/components/tesla/TeslaTimeline";
import { TeslaStatusBadge } from "@/components/tesla/TeslaStatusBadge";

export function OfficeRequestDrawer({
  open,
  onClose,
  request,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  request: any | null;
  onChanged: () => Promise<void> | void;
}) {
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<string>("NORMAL");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    setNotes(request?.notes ?? "");
    setPriority(request?.priority ?? "NORMAL");
  }, [open, request]);

  if (!open || !request) return null;

  async function act(action: "APPROVE" | "REJECT" | "HOLD") {
    try {
      setBusy(true);
      const res = await fetch(`/api/office/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes, priority }),
      });
      const js = await res.json();
      if (!js.ok) {
        alert(js.error || "Action failed");
      } else {
        await onChanged();
      }
    } finally {
      setBusy(false);
    }
  }

  const year = request.vehicle_year ?? request?.vehicle?.year ?? "";
  const make = request.vehicle_make ?? request?.vehicle?.make ?? "";
  const model = request.vehicle_model ?? request?.vehicle?.model ?? "";
  const plate = request.vehicle_plate ?? request?.vehicle?.plate ?? "";
  const vin = request.vehicle_vin ?? request?.vehicle?.vin ?? "";

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full sm:w-[480px] bg-white h-full shadow-xl p-6 overflow-y-auto animate-slideIn">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {request.service_type ?? "Service Request"}
          </h2>
          <TeslaStatusBadge status={request.status ?? "NEW"} />
        </div>

        <TeslaTimeline status={request.status ?? "NEW"} />

        <section className="mt-6 space-y-2">
          <h3 className="font-semibold text-gray-900">Vehicle</h3>
          <p className="text-sm text-gray-700">
            {year} {make} {model} {plate && <span>— {plate}</span>}
          </p>
          {vin && (
            <p className="text-sm text-gray-500">
              VIN: <span className="font-mono">{vin}</span>
            </p>
          )}
        </section>

        <section className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-1">Notes</h3>
          <textarea
            className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal office notes…"
          />
        </section>

        <section className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-2">Priority</h3>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full border rounded-xl p-2 text-sm"
          >
            <option value="LOW">LOW</option>
            <option value="NORMAL">NORMAL</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </section>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <button
            className="py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => act("HOLD")}
            disabled={busy}
          >
            Hold
          </button>
          <button
            className="py-2 rounded-xl border border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => act("REJECT")}
            disabled={busy}
          >
            Reject
          </button>
          <button
            className="py-2 rounded-xl bg-gray-900 text-white hover:opacity-90"
            onClick={() => act("APPROVE")}
            disabled={busy}
          >
            Approve
          </button>
        </div>

        <button
          className="mt-6 w-full py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
          onClick={onClose}
          disabled={busy}
        >
          Close
        </button>
      </div>
    </div>
  );
}
