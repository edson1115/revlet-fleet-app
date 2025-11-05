// app/office/queue/RequestDetails.tsx
"use client";

import { useState } from "react";
import ReadonlyScheduled from "@/components/office/ReadonlyScheduled";

type UUID = string;

type Customer = { id: UUID; name?: string | null } | null;
type Location = { id: UUID; name?: string | null } | null;
type Vehicle = {
  id: UUID;
  unit_number?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  plate?: string | null;
} | null;

type RequestRow = {
  id: UUID;
  status: string;
  created_at?: string;
  scheduled_at?: string | null; // shown read-only
  service?: string | null;
  fmc?: string | null;
  po?: string | null;
  mileage?: number | null;
  priority?: string | null;
  notes?: string | null; // Office notes
  dispatch_notes?: string | null; // shown if present, but not edited here
  customer?: Customer;
  location?: Location;
  vehicle?: Vehicle;
};

const UI_STATUSES = [
  "NEW",
  "WAITING APPROVAL",
  "WAITING FOR PARTS",
  "WAITING TO BE SCHEDULED",
  "SCHEDULED",
  "DISPATCHED",
  "IN PROGRESS",
  "COMPLETED",
  "DECLINED",
] as const;

async function postJSON<T>(url: string, body: any, method: "POST" | "PATCH" = "POST") {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return (await res.json()) as T;
}

export default function RequestDetails({
  request,
  onClose,
  onSaved,
}: {
  request: RequestRow;
  onClose?: () => void;
  onSaved?: (updated: Partial<RequestRow>) => void;
}) {
  // Editable Office fields (DO NOT include scheduled_at here)
  const [status, setStatus] = useState<string>(request.status || "NEW");
  const [service, setService] = useState<string>(request.service || "");
  const [po, setPo] = useState<string>(request.po || "");
  const [fmc, setFmc] = useState<string>(request.fmc || "");
  const [mileage, setMileage] = useState<string>(request.mileage ? String(request.mileage) : "");
  const [priority, setPriority] = useState<string>(request.priority || "");
  const [notes, setNotes] = useState<string>(request.notes || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setErr(null);
    try {
      // Build Office update payload — deliberately exclude scheduled_at
      const payload: any = {
        op: "update_fields",
        id: request.id,
        fields: {
          status,
          service: service || null,
          po: po || null,
          fmc: fmc || null,
          // normalize numeric
          mileage: mileage.trim() ? Number(mileage) : null,
          priority: priority || null,
          notes: notes || null, // Office notes
          // IMPORTANT: Office must NOT update scheduling:
          // scheduled_at: (do not send)
          // technician_id: (do not send)
          // dispatch_notes: (dispatcher-only field; not edited here)
        },
      };

      // safety: make sure scheduled_at cannot sneak in
      if (payload.fields && "scheduled_at" in payload.fields) {
        delete payload.fields.scheduled_at;
      }

      // Hit your batch update endpoint (we’ve been using /api/requests/batch in this project)
      // If your code uses a different endpoint, keep the same `fields` object and switch URL only.
      const out = await postJSON<{ ok: boolean; row?: RequestRow; error?: string }>(
        "/api/requests/batch",
        payload,
        "POST"
      );

      if (out && (out as any).error) throw new Error((out as any).error);

      // Optimistic UI update for parent lists
      onSaved?.({
        id: request.id,
        status,
        service,
        po,
        fmc,
        mileage: mileage.trim() ? Number(mileage) : null,
        priority,
        notes,
      });
      onClose?.();
    } catch (e: any) {
      setErr(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-xl">
      <div className="flex items-start justify-between">
        <h2 className="text-xl font-semibold">Request Details</h2>
        <button onClick={onClose} className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50">
          Close
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {/* Read-only scheduling block (dispatcher controls) */}
        <ReadonlyScheduled value={request?.scheduled_at} className="mt-2" />

        {/* Status (Office may set e.g. WAITING TO BE SCHEDULED, but does not assign time/tech) */}
        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {UI_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Service */}
        <div>
          <label className="text-sm font-medium">Service</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="Oil change, tire inspection, brakes…"
          />
        </div>

        {/* PO / FMC */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">PO</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              value={po}
              onChange={(e) => setPo(e.target.value)}
              placeholder="Purchase Order"
            />
          </div>
          <div>
            <label className="text-sm font-medium">FMC</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              value={fmc}
              onChange={(e) => setFmc(e.target.value)}
              placeholder="Fleet Mgmt Company"
            />
          </div>
        </div>

        {/* Mileage / Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Mileage</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              inputMode="numeric"
              pattern="[0-9]*"
              value={mileage}
              onChange={(e) => setMileage(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="e.g. 48213"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Priority</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              placeholder="High / Normal / Low"
            />
          </div>
        </div>

        {/* Office Notes */}
        <div>
          <label className="text-sm font-medium">Office Notes</label>
          <textarea
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any context we want the dispatcher/tech to see…"
          />
        </div>

        {/* Optional display of dispatcher notes (read-only here) */}
        {request.dispatch_notes ? (
          <div>
            <label className="text-sm font-medium">Dispatcher Notes</label>
            <div className="mt-1 text-sm rounded-lg border px-3 py-2 bg-gray-50">
              {request.dispatch_notes}
            </div>
          </div>
        ) : null}

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={onClose} className="text-sm underline">Cancel</button>
        </div>
      </div>
    </div>
  );
}
