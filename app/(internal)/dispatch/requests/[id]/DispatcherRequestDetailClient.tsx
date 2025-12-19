"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaStatusBadge } from "@/components/tesla/TeslaStatusBadge";
import TeslaButton from "@/components/tesla/TeslaButton";
import TimelineInteractive from "@/components/dispatch/TimelineInteractive";

type Tech = {
  id: string;
  full_name: string;
};

type Request = {
  id: string;
  status: string;
  type: string;
  service?: string;
  urgent?: boolean;

  approval_number?: string;
  invoice_number?: string;
  office_notes?: string;

  customer?: {
    name?: string;
  };

  vehicle?: {
    year?: number;
    make?: string;
    model?: string;
    plate?: string;
    unit_number?: string;
    vin?: string;
  };

  timeline?: {
    id: string;
    role: string;
    note: string;
    created_at: string;
  }[];
};

export default function DispatcherRequestDetailClient({
  requestId,
}: {
  requestId: string;
}) {
  const router = useRouter();

  const [request, setRequest] = useState<Request | null>(null);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [selectedTech, setSelectedTech] = useState("");
  const [timeRange, setTimeRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ================= LOAD ================= */

  async function load() {
    setLoading(true);

    const r = await fetch(
      `/api/dispatch/requests/${requestId}`,
      { cache: "no-store", credentials: "include" }
    );
    const j = await r.json();
    if (j.ok) setRequest(j.request);

    const t = await fetch(
      "/api/dispatch/techs",
      { cache: "no-store", credentials: "include" }
    );
    const tj = await t.json();
    if (tj.ok) setTechs(tj.rows ?? []);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [requestId]);

  /* ================= ACTION ================= */

  async function scheduleJob() {
    if (!selectedTech || !timeRange) {
      alert("Select technician and time window");
      return;
    }

    setSaving(true);

    await fetch(
      `/api/dispatch/requests/${requestId}/schedule`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tech_id: selectedTech,
          scheduled_start_at: timeRange.start,
          scheduled_end_at: timeRange.end,
        }),
      }
    );

    setSaving(false);
    await load();
  }

  /* ================= UI ================= */

  if (loading || !request) {
    return (
      <div className="p-6 text-gray-500">
        Loading request…
      </div>
    );
  }

  const v = request.vehicle;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">

      {/* ================= HEADER ================= */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push("/dispatch/requests")}
            className="text-sm text-gray-600 hover:underline"
          >
            ← Back to Dispatcher Queue
          </button>

          <h1 className="text-2xl font-semibold mt-2">
            {request.service || request.type || "Dispatch Request"}
          </h1>

          {request.customer?.name && (
            <div className="text-sm text-gray-500 mt-1">
              {request.customer.name}
            </div>
          )}
        </div>

        <TeslaStatusBadge status={request.status} />
      </div>

      {/* ================= VEHICLE ================= */}
      {v && (
        <TeslaSection label="Vehicle">
          <div className="grid grid-cols-2 gap-4 text-sm p-4">
            <div>
              {v.year} {v.make} {v.model}
            </div>
            <div>Plate: {v.plate ?? "—"}</div>
            <div>Unit #: {v.unit_number ?? "—"}</div>
            <div>VIN: {v.vin ?? "—"}</div>
          </div>
        </TeslaSection>
      )}

      {/* ================= OFFICE (READ ONLY) ================= */}
      <TeslaSection label="Office Information (Read Only)">
        <div className="p-4 space-y-2 text-sm">
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
      {request.status === "READY_TO_SCHEDULE" && (
        <TeslaSection label="Assign & Schedule">
          <div className="p-4 space-y-6">

            {/* TECH SELECT */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Technician
              </label>
              <select
                className="w-full border rounded-lg p-2"
                value={selectedTech}
                onChange={(e) =>
                  setSelectedTech(e.target.value)
                }
              >
                <option value="">Select technician</option>
                {techs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* TIME WINDOW */}
            <TimelineInteractive
              onChange={(range) =>
                setTimeRange(range)
              }
            />

            {/* CTA */}
            <TeslaButton
              onClick={scheduleJob}
              disabled={saving}
            >
              {saving ? "Scheduling…" : "Schedule Job"}
            </TeslaButton>
          </div>
        </TeslaSection>
      )}

      {/* ================= TIMELINE ================= */}
      {request.timeline?.length ? (
        <TeslaSection label="Activity Timeline">
          <div className="p-4 space-y-3 text-sm">
            {request.timeline.map((t) => (
              <div
                key={t.id}
                className="border-b pb-2"
              >
                <div className="text-xs text-gray-500">
                  {t.role} ·{" "}
                  {new Date(
                    t.created_at
                  ).toLocaleString()}
                </div>
                <div>{t.note}</div>
              </div>
            ))}
          </div>
        </TeslaSection>
      ) : null}

    </div>
  );
}
