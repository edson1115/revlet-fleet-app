"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";
import { RequestNotesTimeline } from "@/components/office/RequestNotesTimeline";
import { RequestPartsSection } from "@/components/office/RequestPartsSection";
import { OfficeFieldsSection } from "@/components/office/OfficeFieldsSection";

const STATUS_FLOW = [
  "NEW",
  "WAITING",
  "READY_TO_SCHEDULE",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
];

const SERVICE_EDITABLE_STATUSES = ["NEW", "WAITING"];

function formatWindow(start?: string | null, end?: string | null) {
  if (!start && !end) return "—";
  try {
    const s = start ? new Date(start).toLocaleString() : "—";
    const e = end ? new Date(end).toLocaleString() : "—";
    return start && end ? `${s} → ${e}` : start || end || "—";
  } catch {
    return "—";
  }
}

export default function OfficeRequestDetailClient({
  request: initialRequest,
}: {
  request: any;
}) {
  const router = useRouter();
  const [request, setRequest] = useState(initialRequest);
  const [saving, setSaving] = useState(false);

  // --------------------------------------------------
  // Service Definition (Office-owned)
  // --------------------------------------------------
  const [serviceTitle, setServiceTitle] = useState(
    initialRequest?.service_title ?? ""
  );
  const [serviceDescription, setServiceDescription] = useState(
    initialRequest?.service_description ?? ""
  );

  const serviceLocked = !SERVICE_EDITABLE_STATUSES.includes(request.status);
  const currentIndex = STATUS_FLOW.indexOf(request.status);

  const assignedTechName = useMemo(
    () =>
      request?.tech?.full_name ||
      request?.assigned_tech?.full_name ||
      request?.assigned_tech_name ||
      request?.tech_name ||
      null,
    [request]
  );

  const scheduledWindow = useMemo(
    () => formatWindow(request?.scheduled_start_at, request?.scheduled_end_at),
    [request]
  );

  async function saveServiceOverride() {
    if (saving || serviceLocked) return;
    setSaving(true);

    const res = await fetch(`/api/office/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        service_title: serviceTitle || null,
        service_description: serviceDescription || null,
      }),
    });

    const js = await res.json();
    setSaving(false);

    if (!res.ok) {
      alert(js.error || "Failed to save service definition");
      return;
    }

    setRequest({
      ...request,
      service_title: serviceTitle || null,
      service_description: serviceDescription || null,
    });
  }

  const v = request.vehicle;
  const c = request.customer;

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* HEADER NAV */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <button
            onClick={() => router.push("/office")}
            className="hover:underline"
          >
            ← Office Dashboard
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => router.push("/office/requests")}
            className="hover:underline"
          >
            ← Office Requests
          </button>
        </div>
        <TeslaStatusChip status={request.status} />
      </div>

      {/* CONTEXT */}
      <div className="text-sm text-gray-600">
        {c?.name && <span className="font-medium">{c.name}</span>}
        {v?.unit_number && <span> · Unit {v.unit_number}</span>}
        {!v?.unit_number && v?.plate && <span> · Plate {v.plate}</span>}
        {(v?.year || v?.make || v?.model) && (
          <span>
            {" "}
            · {[v?.year, v?.make, v?.model].filter(Boolean).join(" ")}
          </span>
        )}
      </div>

      {/* STATUS */}
      <TeslaSection label="Status Progression">
        <div className="flex flex-wrap gap-3">
          {STATUS_FLOW.map((s, i) => (
            <div
              key={s}
              className={clsx(
                "px-4 py-2 rounded-full text-xs font-semibold",
                i <= currentIndex
                  ? "bg-black text-white"
                  : "bg-gray-200 text-gray-600"
              )}
            >
              {s.replaceAll("_", " ")}
            </div>
          ))}
        </div>
      </TeslaSection>

      {/* DISPATCH (READ ONLY) */}
      <TeslaSection label="Dispatch Assignment (Read Only)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-500">Assigned Technician</div>
            <div className="font-medium">{assignedTechName ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Scheduled Window</div>
            <div className="font-medium">{scheduledWindow}</div>
          </div>
        </div>
      </TeslaSection>

      {/* OFFICE INTERNAL */}
      <OfficeFieldsSection request={request} />

      {/* SERVICE DEFINITION */}
      <TeslaSection
        label={
          <div className="flex items-center gap-2">
            <span>Service Definition (Customer-Facing)</span>
            {serviceLocked && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                Locked
              </span>
            )}
          </div>
        }
      >
        {serviceLocked && (
          <div className="text-xs text-gray-500 mb-2">
            Service definition is locked once the request is ready to schedule.
          </div>
        )}

        <div className="space-y-4">
          <input
            disabled={serviceLocked}
            value={serviceTitle}
            onChange={(e) => setServiceTitle(e.target.value)}
            placeholder={request.service || request.type || "Service Request"}
            className={clsx(
              "w-full rounded-lg border px-3 py-2 text-sm",
              serviceLocked && "bg-gray-100 cursor-not-allowed"
            )}
          />

          <textarea
            disabled={serviceLocked}
            value={serviceDescription}
            onChange={(e) => setServiceDescription(e.target.value)}
            rows={3}
            className={clsx(
              "w-full rounded-lg border px-3 py-2 text-sm",
              serviceLocked && "bg-gray-100 cursor-not-allowed"
            )}
          />

          <button
            onClick={saveServiceOverride}
            disabled={serviceLocked || saving}
            className={clsx(
              "rounded-lg py-2 text-sm font-medium",
              serviceLocked
                ? "bg-gray-300 cursor-not-allowed text-gray-600"
                : "bg-black text-white hover:bg-gray-900"
            )}
          >
            {saving
              ? "Saving…"
              : serviceLocked
              ? "Locked after READY TO SCHEDULE"
              : "Save Service Definition"}
          </button>
        </div>
      </TeslaSection>

      <RequestPartsSection requestId={request.id} />
      <RequestNotesTimeline requestId={request.id} />
    </div>
  );
}
