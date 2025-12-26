"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Image from "next/image";

import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";
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
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [completing, setCompleting] = useState(false);

  /* -------------------------------------------
     SERVICE DEFINITION STATE
   -------------------------------------------- */
  const [serviceTitle, setServiceTitle] = useState(
    initialRequest?.service_title ?? ""
  );
  const [serviceDescription, setServiceDescription] = useState(
    initialRequest?.service_description ?? ""
  );
  const [completionNote, setCompletionNote] = useState("");

  if (!request) return <div>Loading...</div>;

  const serviceLocked = !SERVICE_EDITABLE_STATUSES.includes(request.status);
  const currentIndex = STATUS_FLOW.indexOf(request.status);

  // Walk-in Logic
  const isWalkIn =
    request?.created_by_role === "OFFICE" &&
    !request?.technician_id &&
    !request?.scheduled_start_at;
  const canOfficeComplete = isWalkIn && request.status !== "COMPLETED";

  // Helpers
  const v = request.vehicle;
  const c = request.customer;
  const images = request.request_images || [];
  
  // ✅ FIX: Safely extract FMC Name
  const fmcName = v?.provider_companies?.name || "None";

  const assignedTechName = useMemo(
    () =>
      request?.tech?.full_name ||
      request?.assigned_tech?.full_name ||
      "Unassigned",
    [request]
  );

  const scheduledWindow = useMemo(
    () => formatWindow(request?.scheduled_start_at, request?.scheduled_end_at),
    [request]
  );

  /* -------------------------------------------
     ACTIONS
   -------------------------------------------- */
  async function updateStatus(newStatus: string) {
    if (statusUpdating) return;
    if (!confirm(`Change status to ${newStatus.replace(/_/g, " ")}?`)) return;

    setStatusUpdating(true);
    const res = await fetch(`/api/office/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    setStatusUpdating(false);
    if (res.ok) {
      setRequest({ ...request, status: newStatus });
    } else {
      alert("Failed to update status");
    }
  }

  async function saveServiceOverride() {
    if (saving || serviceLocked) return;
    setSaving(true);

    const res = await fetch(`/api/office/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_title: serviceTitle || null,
        service_description: serviceDescription || null,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setRequest({ ...request, service_title: serviceTitle, service_description: serviceDescription });
      alert("Service definition updated.");
    }
  }

  async function markComplete() {
    if (!completionNote.trim()) return alert("Note required.");
    if (!confirm("Complete this request?")) return;
    setCompleting(true);

    const res = await fetch(`/api/office/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "COMPLETED",
        completed_by_role: "OFFICE",
        completed_at: new Date().toISOString(),
        completion_note: completionNote,
      }),
    });

    const js = await res.json();
    setCompleting(false);
    if (res.ok) {
        setRequest({ ...request, status: "COMPLETED", completed_at: js.completed_at });
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* 1. HEADER NAV */}
      <div className="flex items-center justify-between py-4 border-b border-gray-100">
        <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
          <button onClick={() => router.push("/office")} className="hover:text-black transition">
            &larr; Dashboard
          </button>
          <span className="text-gray-300">/</span>
          <button onClick={() => router.push("/office/requests")} className="hover:text-black transition">
            Requests Queue
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-black">Ref #{request.id.slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-3">
            <TeslaStatusChip status={request.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: CONTEXT & CUSTOMER DATA */}
        <div className="space-y-6 lg:col-span-2">
            
            {/* 2. CUSTOMER INTAKE DATA (READ ONLY) */}
            <TeslaSection label="Vehicle & Customer Intake">
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Vehicle</p>
                        <div className="text-lg font-semibold">{v?.year} {v?.make} {v?.model}</div>
                        <div className="text-sm text-gray-600">Unit: {v?.unit_number || "—"}</div>
                        <div className="text-xs text-gray-400 mt-1">VIN: {v?.vin || "—"}</div>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Plate</p>
                        <div className="text-lg font-medium font-mono">{v?.plate || "NO PLATE"}</div>
                    </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                      <div>
                        <p className="text-xs text-gray-500">Reported Mileage</p>
                        {/* ✅ FIX: Display Correct Mileage Column */}
                        <p className="font-medium">
                           {request.reported_mileage 
                                ? `${request.reported_mileage.toLocaleString()} mi` 
                                : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">FMC / Fleet Co.</p>
                        {/* ✅ FIX: Display fetched FMC Name */}
                        <p className="font-medium">{fmcName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="font-medium">{c?.name || "Unknown"}</p>
                      </div>
                </div>

                {/* ORIGINAL CUSTOMER REQUEST */}
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase mb-1">Customer's Original Note</p>
                    <p className="text-sm text-gray-800 italic">"{request.notes || "No notes provided."}"</p>
                </div>
            </TeslaSection>

            {/* 3. CUSTOMER IMAGES */}
            {images.length > 0 && (
                <TeslaSection label={`Customer Images (${images.length})`}>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {images.map((img: any) => (
                            <a key={img.id} href={img.url_full} target="_blank" rel="noreferrer" className="block group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                <Image src={img.url_full} alt="Request" fill className="object-cover group-hover:scale-105 transition" />
                            </a>
                        ))}
                    </div>
                </TeslaSection>
            )}

            {/* 4. SERVICE DEFINITION (OFFICE OVERRIDE) */}
            <TeslaSection label="Service Definition (Office)">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 font-semibold">Service Title</label>
                        <input
                            disabled={serviceLocked}
                            value={serviceTitle}
                            onChange={(e) => setServiceTitle(e.target.value)}
                            className="w-full mt-1 border-b border-gray-300 focus:border-black py-2 outline-none text-lg font-medium bg-transparent disabled:text-gray-400"
                            placeholder="e.g. 50k Mile Service"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-semibold">Details / Instructions</label>
                        <textarea
                            disabled={serviceLocked}
                            value={serviceDescription}
                            onChange={(e) => setServiceDescription(e.target.value)}
                            rows={3}
                            className="w-full mt-1 p-3 bg-gray-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black disabled:text-gray-400"
                            placeholder="Internal notes for the technician..."
                        />
                    </div>
                    {!serviceLocked && (
                          <div className="flex justify-end">
                            <button 
                                onClick={saveServiceOverride} 
                                disabled={saving}
                                className="text-xs font-bold text-green-600 uppercase tracking-wider hover:underline"
                            >
                                {saving ? "Saving..." : "Save Definition"}
                            </button>
                          </div>
                    )}
                </div>
            </TeslaSection>
            
            {/* 5. PARTS REQUIRED */}
            <RequestPartsSection request={request} />

        </div>

        {/* RIGHT COLUMN: STATUS & OPS */}
        <div className="space-y-6">
            
            {/* 🆕 WORKFLOW ACTIONS (STATUS CONTROLS) */}
            <TeslaSection label="Workflow Actions">
                <div className="space-y-3">
                    {request.status === "NEW" && (
                        <>
                            <button 
                                onClick={() => updateStatus("WAITING")}
                                disabled={statusUpdating}
                                className="w-full py-3 bg-amber-100 text-amber-900 font-bold rounded-xl hover:bg-amber-200 transition text-sm"
                            >
                                ⏳ Mark as Waiting (Parts/Approval)
                            </button>
                            <button 
                                onClick={() => updateStatus("READY_TO_SCHEDULE")}
                                disabled={statusUpdating}
                                className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition text-sm"
                            >
                                🚀 Send to Dispatch (Ready)
                            </button>
                        </>
                    )}

                    {request.status === "WAITING" && (
                        <>
                             <button 
                                onClick={() => updateStatus("NEW")}
                                disabled={statusUpdating}
                                className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition text-sm"
                            >
                                ↩ Revert to New
                            </button>
                            <button 
                                onClick={() => updateStatus("READY_TO_SCHEDULE")}
                                disabled={statusUpdating}
                                className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition text-sm"
                            >
                                🚀 Send to Dispatch (Ready)
                            </button>
                        </>
                    )}

                    {request.status === "READY_TO_SCHEDULE" && (
                         <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-center">
                            <p className="text-green-800 font-bold mb-2">Ready for Dispatch</p>
                            <p className="text-green-700 text-xs mb-4">This request is now visible on the Dispatch board.</p>
                            <button 
                                onClick={() => updateStatus("WAITING")}
                                disabled={statusUpdating}
                                className="text-xs font-bold text-green-700 hover:underline"
                            >
                                Undo (Recall to Waiting)
                            </button>
                         </div>
                    )}

                    {["SCHEDULED", "IN_PROGRESS"].includes(request.status) && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                            <p className="text-gray-500 font-bold text-sm">Under Dispatch Control</p>
                            <p className="text-gray-400 text-xs mt-1">Status managed by Dispatch/Tech</p>
                        </div>
                    )}
                </div>
            </TeslaSection>

            {/* STATUS TIMELINE */}
            <TeslaSection label="Progression">
                <div className="space-y-6 relative pl-2">
                      <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100" />
                      {STATUS_FLOW.map((s, i) => {
                          const active = i <= currentIndex;
                          const current = i === currentIndex;
                          return (
                            <div key={s} className="relative flex items-center gap-3">
                                <div className={clsx(
                                    "w-3 h-3 rounded-full z-10",
                                    current ? "bg-green-500 ring-4 ring-green-100" : active ? "bg-black" : "bg-gray-200"
                                )} />
                                <span className={clsx("text-xs font-bold tracking-wide", active ? "text-black" : "text-gray-400")}>
                                    {s.replace(/_/g, " ")}
                                </span>
                            </div>
                          );
                      })}
                </div>
            </TeslaSection>

            {/* DISPATCH INFO */}
            <TeslaSection label="Dispatch">
                <div className="space-y-3">
                    <div>
                        <p className="text-xs text-gray-500">Technician</p>
                        <p className="font-medium text-lg">{assignedTechName}</p>
                    </div>
                    <div>
                         <p className="text-xs text-gray-500">Schedule</p>
                         <p className="text-sm">{scheduledWindow}</p>
                    </div>
                </div>
            </TeslaSection>

            {/* OFFICE FIELDS (PO, INVOICE) */}
            <OfficeFieldsSection request={request} />

            {/* COMPLETION (WALK-IN ONLY) */}
            {canOfficeComplete && (
                <div className="p-4 bg-gray-100 rounded-xl">
                    <h3 className="text-sm font-bold mb-2">Complete Walk-In</h3>
                    <textarea
                        value={completionNote}
                        onChange={(e) => setCompletionNote(e.target.value)}
                        placeholder="Completion notes..."
                        className="w-full text-sm p-2 rounded mb-2"
                    />
                    <button onClick={markComplete} disabled={completing} className="w-full bg-black text-white py-2 rounded-lg text-sm font-bold">
                        {completing ? "..." : "Mark Complete"}
                    </button>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}