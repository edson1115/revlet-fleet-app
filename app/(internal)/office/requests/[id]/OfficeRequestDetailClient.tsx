"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { RequestPartsSection } from "@/components/office/RequestPartsSection";
import { OfficeFieldsSection } from "@/components/office/OfficeFieldsSection";
import { RevenueOptimizer } from "@/components/office/RevenueOptimizer";

/* ===============================
    Icons
================================ */
const IconCar = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const IconUser = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconGauge = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 9l3-3" />
  </svg>
);

const IconShare = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-5.368 3 3 0 000 5.368zm0 10.684a3 3 0 100-5.368 3 3 0 000 5.368z" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

/* ===============================
    Component
================================ */
export default function OfficeRequestDetailClient({
  request: initialRequest,
  logs = [],
}: {
  request: any;
  logs?: any[];
}) {
  const router = useRouter();

  const [request, setRequest] = useState(initialRequest);
  const [serviceTitle, setServiceTitle] = useState(initialRequest.service_title || "");
  const [serviceDescription, setServiceDescription] = useState(initialRequest.service_description || "");
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);

  const v = request.vehicle;
  const c = request.customer;

  const snapshotPlate = request.plate;
  const livePlate = v?.plate;
  const displayPlate = snapshotPlate || livePlate || "NO PLATE";

  const assignedTechs: string[] = request.assigned_techs || [];
  const displayMileage = request.display_mileage;

  const isEditable = ["NEW", "WAITING"].includes(request.status);

  /* ===============================
      ACTIONS
  =============================== */
  const handleShare = () => {
    const portalUrl = `${window.location.origin}/portal/${request.id}`;
    navigator.clipboard.writeText(portalUrl);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  function handleRequestUpdate(updates: any) {
    if (updates.service_description) {
      setServiceDescription(updates.service_description);
    }
    setRequest({ ...request, ...updates });
  }

  async function handleSave() {
    if (!isEditable) return;
    setSaving(true);
    const res = await fetch(`/api/office/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_title: serviceTitle,
        service_description: serviceDescription,
      }),
    });
    const json = await res.json();
    if (json.ok) setRequest(json.request);
    else alert("Failed to save changes");
    setSaving(false);
  }

  async function handleSendToDispatch() {
    if (!isEditable) return;
    const res = await fetch(`/api/office/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "READY_TO_SCHEDULE" }),
    });
    const json = await res.json();
    if (json.ok) {
      setRequest(json.request);
      router.push("/office");
    } else alert("Failed to send to dispatch");
  }

  function handleGoToInvoice() {
    router.push(`/office/requests/${request.id}/invoice`);
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* TOP BAR */}
      <div className="bg-white border-b sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <div
            onClick={() => router.push("/office")}
            className="text-xs font-bold text-gray-400 uppercase cursor-pointer hover:text-black"
          >
            ← Return to Dashboard
          </div>
          <h1 className="text-xl font-bold mt-1 flex items-center gap-2 text-gray-900">
            {request.service_title}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-black uppercase">
              {request.status}
            </span>
          </h1>
        </div>

        <div className="flex gap-2">
          {/* 🔗 SHARE PORTAL BUTTON */}
          <button
            onClick={handleShare}
            className={clsx(
              "px-4 py-2 text-xs font-bold rounded-lg border transition-all flex items-center gap-2",
              copying ? "bg-green-50 border-green-200 text-green-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            {copying ? <IconCheck /> : <IconShare />}
            {copying ? "Link Copied!" : "Share Portal"}
          </button>

          <button
            onClick={handleGoToInvoice}
            className="px-4 py-2 text-xs font-bold rounded-lg border-2 border-black text-black hover:bg-black hover:text-white transition flex items-center gap-2"
          >
            <span>$</span> Invoice
          </button>

          <button
            onClick={handleSave}
            disabled={!isEditable || saving}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            onClick={handleSendToDispatch}
            disabled={!isEditable}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-40"
          >
            Send to Dispatch
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl p-5 border flex gap-4 shadow-sm">
            <IconUser />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Customer</p>
              <p className="font-bold text-gray-900">{c?.name}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex gap-4">
              <IconCar />
              <div>
                <p className="font-bold text-gray-900">{v?.year} {v?.make} {v?.model}</p>
                <p className="text-xs text-gray-500 font-mono">VIN: {v?.vin}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Plate: <span className="font-mono font-bold bg-zinc-100 px-1.5 py-0.5 rounded text-black">{displayPlate}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5 flex gap-4 shadow-sm">
            <IconGauge />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Mileage</p>
              <p className="font-bold text-gray-900">{displayMileage ? `${displayMileage.toLocaleString()} mi` : "—"}</p>
            </div>
          </div>

          <div className="bg-zinc-900 text-white rounded-xl p-5 shadow-lg">
            <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest mb-2">Technician Assignment</p>
            {assignedTechs.length > 0 ? (
              <ul className="space-y-1">
                {assignedTechs.map((t, idx) => (
                  <li key={idx} className="font-bold flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> {t}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500 italic text-sm">Waiting for Dispatch...</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-8 space-y-8">
          
          <RevenueOptimizer request={request} onUpdate={handleRequestUpdate} />

          {/* SERVICE DETAILS */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Internal Service Requisition</h3>
            <input
              value={serviceTitle}
              disabled={!isEditable}
              onChange={(e) => setServiceTitle(e.target.value)}
              placeholder="Service Title"
              className={`w-full text-2xl font-black outline-none mb-4 ${!isEditable ? "bg-gray-50 text-gray-400" : "text-gray-900 border-b border-gray-100"}`}
            />
            <textarea
              value={serviceDescription}
              disabled={!isEditable}
              onChange={(e) => setServiceDescription(e.target.value)}
              rows={4}
              className={`w-full p-4 rounded-xl text-sm leading-relaxed ${!isEditable ? "bg-gray-50 text-gray-400" : "bg-gray-50 text-gray-700 border border-gray-100 focus:bg-white transition"}`}
              placeholder="Technician instructions..."
            />
          </div>

          {/* 📸 TECHNICIAN DOCUMENTATION (NEW) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-zinc-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Field Documentation</h3>
              <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded font-black uppercase">Live from Bay</span>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Tech Notes */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Tech Inspection Notes</label>
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-gray-700 text-sm italic leading-relaxed">
                  {request.technician_notes || "Technician has not submitted findings yet."}
                </div>
              </div>

              {/* Photos Grid */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Inspection Photos</label>
                <div className="grid grid-cols-4 gap-3">
                  {request.request_images?.map((img: any, i: number) => (
                    <a 
                      key={i} 
                      href={img.image_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-blue-500 transition shadow-sm group relative"
                    >
                      <img src={img.image_url} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" alt="Inspection" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                         <span className="text-[10px] font-bold text-white uppercase bg-black/40 px-2 py-1 rounded">Zoom</span>
                      </div>
                    </a>
                  ))}
                  {(!request.request_images || request.request_images.length === 0) && (
                    <div className="col-span-4 py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-300 text-xs font-bold uppercase tracking-widest">
                      Awaiting Documentation
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <RequestPartsSection
            requestId={request.id}
            vehicleContext={v}
            serviceContext={serviceTitle}
          />

          <OfficeFieldsSection request={request} />

          {/* ACTIVITY LOG */}
          {logs.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Activity Audit Trail</h3>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="text-xs text-gray-500 font-mono flex items-start gap-3">
                    <span className="text-gray-300 shrink-0">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-bold text-gray-700 shrink-0 uppercase tracking-tighter">[{log.action}]</span>
                    <span className="text-gray-600">{log.message || "No details provided"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}