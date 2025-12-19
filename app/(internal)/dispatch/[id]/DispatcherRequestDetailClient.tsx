"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import TeslaButton from "@/components/tesla/TeslaButton";
import TeslaInput from "@/components/tesla/TeslaInput";
import { TeslaStatusBadge } from "@/components/tesla/TeslaStatusBadge";

type Tech = {
  id: string;
  full_name: string;
};

type Request = {
  id: string;
  status: string;
  type: string;
  urgent: boolean;
  service?: string;

  vehicle?: {
    year?: number;
    make?: string;
    model?: string;
    plate?: string;
    unit_number?: string;
  };

  approval_number?: string;
  invoice_number?: string;
  office_notes?: string;
};

export default function DispatcherRequestDetailClient({
  requestId,
}: {
  requestId: string;
}) {
  const [request, setRequest] = useState<Request | null>(null);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [techId, setTechId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);

  /* ================= LOAD ================= */

  async function load() {
    const r = await fetch(`/api/dispatch/requests/${requestId}`, {
      cache: "no-store",
      credentials: "include",
    });
    const j = await r.json();
    if (j.ok) setRequest(j.request);

    const t = await fetch("/api/dispatch/techs", {
      cache: "no-store",
      credentials: "include",
    });
    const tj = await t.json();
    if (tj.ok) setTechs(tj.rows ?? []);
  }

  useEffect(() => {
    load();
  }, [requestId]);

  if (!request) {
    return <div className="p-6 text-gray-500">Loading…</div>;
  }

  /* ================= SCHEDULE ================= */

  async function schedule() {
    if (!techId || !start || !end) return;

    setSaving(true);

    await fetch(`/api/dispatch/requests/${requestId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        tech_id: techId,
        scheduled_start_at: start,
        scheduled_end_at: end,
      }),
    });

    setSaving(false);
    await load();
  }

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dispatch Request</h1>
        <TeslaStatusBadge status={request.status} />
      </div>

      {/* ================= VEHICLE ================= */}
      {request.vehicle && (
        <TeslaSection label="Vehicle">
          <div className="p-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              {request.vehicle.year}{" "}
              {request.vehicle.make}{" "}
              {request.vehicle.model}
            </div>
            <div>Plate: {request.vehicle.plate ?? "—"}</div>
            <div>Unit #: {request.vehicle.unit_number ?? "—"}</div>
          </div>
        </TeslaSection>
      )}

      {/* ================= OFFICE (READ ONLY) ================= */}
      <TeslaSection label="Office Internal (Read Only)">
        <div className="p-4 text-sm space-y-2">
          <div>
            <b>Approval #:</b>{" "}
            {request.approval_number ?? "—"}
          </div>
          <div>
            <b>Invoice #:</b>{" "}
            {request.invoice_number ?? "—"}
          </div>
          <div>
            <b>Office Notes:</b>
            <div className="text-gray-600 mt-1">
              {request.office_notes ?? "—"}
            </div>
          </div>
        </div>
      </TeslaSection>

      {/* ================= SCHEDULING ================= */}
      {request.status === "TO_BE_SCHEDULED" && (
        <TeslaSection label="Schedule Technician">
          <div className="p-4 space-y-4">
            <select
              className="w-full border rounded-lg p-2"
              value={techId}
              onChange={(e) => setTechId(e.target.value)}
            >
              <option value="">Select technician</option>
              {techs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>

            <TeslaInput
              type="datetime-local"
              label="Start"
              value={start}
              onChange={(e: any) => setStart(e.target.value)}
            />

            <TeslaInput
              type="datetime-local"
              label="End"
              value={end}
              onChange={(e: any) => setEnd(e.target.value)}
            />

            <TeslaButton
              onClick={schedule}
              disabled={saving}
            >
              {saving ? "Scheduling…" : "Schedule Job"}
            </TeslaButton>
          </div>
        </TeslaSection>
      )}
    </div>
  );
}
