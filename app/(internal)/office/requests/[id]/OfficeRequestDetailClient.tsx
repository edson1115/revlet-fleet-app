"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { RequestPartsSection } from "@/components/office/RequestPartsSection";
import { OfficeFieldsSection } from "@/components/office/OfficeFieldsSection";
import { RevenueOptimizer } from "@/components/office/RevenueOptimizer";
import { REQUEST_STATUS, RequestStatusKey } from "@/lib/requestStatus";

/* ===============================
   ICONS
================================ */
const IconCar = () => <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const IconBox = () => <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconUser = () => <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconGauge = () => <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 9l3-3" /></svg>;
const IconShare = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-5.368 3 3 0 000 5.368zm0 10.684a3 3 0 100-5.368 3 3 0 000 5.368z" /></svg>;
const IconCheck = () => <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const IconBack = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;

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
  const [serviceDescription, setServiceDescription] = useState(initialRequest.service_description || initialRequest.description || "");
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);

  // 🧠 INTELLIGENCE: Detect Order Type
  const isProcurement = request.service_title === "Tire Purchase";
  const v = request.vehicle;
  const c = request.customer;

  // 🔍 PO EXTRACTION
  const poMatch = serviceDescription.match(/PO #:\s*(.+)/);
  const poValue = poMatch ? poMatch[1].trim() : "N/A";

  // 🏷️ SMART LABELS
  const displayTitle = v 
    ? `${v.year} ${v.make} ${v.model}` 
    : (isProcurement ? "Fleet Procurement Order" : "Unassigned Vehicle");

  const displaySubtitle = v 
    ? v.plate 
    : (isProcurement ? `PO: ${poValue}` : "NO PLATE");

  const displayVin = v?.vin || (isProcurement ? "Non-Asset Item" : "N/A");

  // Status Configuration
  const statusKey = (request.status as RequestStatusKey) || "NEW";
  const statusConfig = REQUEST_STATUS[statusKey] || REQUEST_STATUS.NEW;
  
  const isEditable = ["NEW", "WAITING", "WAITING_APPROVAL", "ATTENTION_REQUIRED"].includes(request.status);

  /* ===============================
     HANDLERS
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

  async function handleApprove() {
    if (!isEditable) return;
    
    // Optimistic
    const previousStatus = request.status;
    setRequest({ ...request, status: "READY_TO_SCHEDULE" });

    const res = await fetch(`/api/office/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "READY_TO_SCHEDULE" }), 
    });
    
    const json = await res.json();
    if (json.ok) {
      setRequest(json.request);
      router.refresh(); 
    } else {
      console.error(json.error);
      alert("Failed to approve. Check console.");
      setRequest({ ...request, status: previousStatus }); 
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-20 font-sans text-zinc-900">
      
      {/* 1️⃣ HEADER BAR */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm/50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/office")}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition"
          >
            <IconBack />
          </button>
          
          <div>
            <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-zinc-900 tracking-tight">{request.service_title}</h1>
                <span className={clsx(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 border border-transparent",
                    statusConfig.bg,
                    statusConfig.text
                )}>
                    <div className={clsx("w-1.5 h-1.5 rounded-full", statusConfig.dot, statusConfig.pulse && "animate-pulse")} />
                    {statusConfig.label}
                </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5 uppercase tracking-wider">
                ID: {request.id.slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Share */}
          <button
            onClick={handleShare}
            className={clsx(
              "px-3 py-2 text-xs font-bold rounded-lg border transition-all flex items-center gap-2",
              copying ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {copying ? <IconCheck /> : <IconShare />}
            {copying ? "Copied" : "Share"}
          </button>

          {/* Invoice */}
          <button
            onClick={() => router.push(`/office/requests/${request.id}/invoice`)}
            className="px-4 py-2 text-xs font-bold rounded-lg border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 transition flex items-center gap-2"
          >
            <span>$</span> Invoice
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!isEditable || saving}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {/* Approve */}
          {isEditable && (
             <button
                onClick={handleApprove}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-black text-white hover:bg-zinc-800 transition shadow-lg flex items-center gap-2"
             >
                Approve & Dispatch
             </button>
          )}
        </div>
      </header>

      {/* 2️⃣ MAIN GRID */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (Context) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Customer Card */}
          <div className="bg-white rounded-xl p-5 border border-zinc-200 flex gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                <IconUser />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Customer</p>
              <p className="font-bold text-zinc-900 text-lg leading-tight">{c?.name}</p>
              <p className="text-xs text-zinc-500 mt-1">{c?.email || "No email"}</p>
            </div>
          </div>

          {/* Asset / Order Card */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                 {isProcurement ? <IconBox /> : <IconCar />}
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    {isProcurement ? "Order Reference" : "Asset Details"}
                </p>
                <p className="font-bold text-zinc-900 text-lg leading-tight">{displayTitle}</p>
                
                <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[10px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 border border-zinc-200">
                        {isProcurement ? "TYPE: PARTS" : `VIN: ${displayVin}`}
                    </span>
                    <span className={clsx(
                        "text-[10px] font-mono px-1.5 py-0.5 rounded border",
                        isProcurement ? "bg-blue-50 text-blue-700 border-blue-100 font-bold" : "bg-zinc-100 text-zinc-900 border-zinc-200"
                    )}>
                        {displaySubtitle}
                    </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mileage (Only for Vehicles) */}
          {!isProcurement && (
            <div className="bg-white rounded-xl border border-zinc-200 p-5 flex gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                <IconGauge />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Odometer</p>
                <p className="font-bold text-zinc-900 text-lg">
                    {request.display_mileage ? `${request.display_mileage.toLocaleString()} mi` : "—"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (Work) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Revenue Optimizer (Smart Upsell) */}
          <RevenueOptimizer request={request} onUpdate={handleRequestUpdate} />

          {/* Service Requisition */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Internal Service Requisition</h3>
            
            <div className="space-y-4">
                <input
                value={serviceTitle}
                disabled={!isEditable}
                onChange={(e) => setServiceTitle(e.target.value)}
                placeholder="Service Title"
                className={clsx(
                    "w-full text-2xl font-black outline-none transition",
                    isEditable ? "text-zinc-900 border-b border-zinc-200 focus:border-black" : "bg-transparent text-zinc-500 cursor-not-allowed"
                )}
                />
                <textarea
                value={serviceDescription}
                disabled={!isEditable}
                onChange={(e) => setServiceDescription(e.target.value)}
                rows={5}
                className={clsx(
                    "w-full p-4 rounded-xl text-sm leading-relaxed font-medium transition outline-none resize-none",
                    isEditable 
                        ? "bg-zinc-50 text-zinc-800 border border-zinc-200 focus:bg-white focus:ring-2 focus:ring-black/5" 
                        : "bg-zinc-50/50 text-zinc-400 border border-transparent cursor-not-allowed"
                )}
                placeholder="Technician instructions, PO numbers, or specific details..."
                />
            </div>
          </div>

          {/* Field Documentation */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
              <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Field Documentation</h3>
              <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-wide">Live Feed</span>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Tech Notes */}
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase mb-2 block">Technician Notes</label>
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-zinc-600 text-sm italic leading-relaxed">
                  {request.technician_notes || "Technician has not submitted findings yet."}
                </div>
              </div>

              {/* Photos Grid */}
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase mb-2 block">Inspection Photos</label>
                <div className="grid grid-cols-4 gap-3">
                  {request.request_images?.map((img: any, i: number) => (
                    <a 
                      key={i} 
                      href={img.image_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="aspect-square rounded-xl overflow-hidden border border-zinc-200 hover:border-blue-500 transition shadow-sm group relative"
                    >
                      <img src={img.image_url} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" alt="Inspection" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white uppercase bg-black/40 px-2 py-1 rounded">View</span>
                      </div>
                    </a>
                  ))}
                  {(!request.request_images || request.request_images.length === 0) && (
                    <div className="col-span-4 py-8 text-center border-2 border-dashed border-zinc-100 rounded-xl">
                      <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Awaiting Media</p>
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

          {/* Audit Log */}
          {logs.length > 0 && (
            <div className="mt-8 border-t border-zinc-200 pt-8 opacity-60 hover:opacity-100 transition">
              <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-4">Activity Audit Trail</h3>
              <div className="space-y-2">
                {logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="text-[10px] text-zinc-500 font-mono flex items-center gap-3">
                    <span className="text-zinc-300 shrink-0">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-bold text-zinc-700 shrink-0 uppercase tracking-tighter w-16">[{log.action}]</span>
                    <span className="text-zinc-600 truncate">{log.message || "No details provided"}</span>
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