"use client";

import { useState, useMemo } from "react";
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
const IconAlert = () => <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const IconBuilding = () => <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;

// 🛠️ CONFIG: Default Shop Creds
const DEFAULT_SHOP_NAME = "Revlet HQ (In-House)";
const DEFAULT_SHOP_PHONE = "(555) 123-4567";

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
  
  // ✅ NEW: Shop Modal State
  const [showShopModal, setShowShopModal] = useState(false);
  const [shopName, setShopName] = useState(initialRequest.shop_name || DEFAULT_SHOP_NAME);
  const [shopPhone, setShopPhone] = useState(initialRequest.shop_phone || DEFAULT_SHOP_PHONE);

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
  const mileageValue = request.display_mileage || request.vehicle?.mileage;

  // Status Configuration
  const statusKey = (request.status as RequestStatusKey) || "NEW";
  const statusConfig = REQUEST_STATUS[statusKey] || REQUEST_STATUS.NEW;
  
  const isEditable = ["NEW", "WAITING", "WAITING_APPROVAL", "ATTENTION_REQUIRED"].includes(request.status);
  const isCompleted = request.status === "COMPLETED" || request.status === "BILLED";
  const isAtShop = request.status === "AT_SHOP"; 

  // 🚨 FINDINGS LOGIC
  const techNotes = request.technician_notes || "";
  const findings = useMemo(() => {
      if (!techNotes) return [];
      const lines = techNotes.split('\n');
      return lines.filter((l: string) => l.includes('🔴') || l.includes('🟡'));
  }, [techNotes]);

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
    if (!isEditable && !isAtShop) return; // Allow save if At Shop too
    setSaving(true);
    
    const res = await fetch(`/api/office/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_title: serviceTitle,
        service_description: serviceDescription,
        // ✅ Include shop details if saving while at shop
        shop_name: shopName,
        shop_phone: shopPhone
      }),
    });
    
    const json = await res.json();
    
    if (json.ok) {
        router.refresh();
        router.push("/office");
    } else {
        alert("Failed to save changes");
        setSaving(false);
    }
  }

  async function handleApprove() {
    if (!isEditable) return;
    setSaving(true); 
    
    const res = await fetch(`/api/office/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
          status: "READY_TO_SCHEDULE",
          service_title: serviceTitle,
          service_description: serviceDescription
      }), 
    });
    
    const json = await res.json();
    if (json.ok) {
      router.push("/office");
      router.refresh(); 
    } else {
      console.error(json.error);
      alert("Failed to approve. Check console.");
      setSaving(false); 
    }
  }

  // ✅ NEW: Dispatch to Shop Handler
  async function handleSendToShop() {
      if (!shopName) return alert("Please enter a shop name.");
      setSaving(true);

      const res = await fetch(`/api/office/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            status: "AT_SHOP",
            service_title: serviceTitle,
            service_description: serviceDescription,
            shop_name: shopName,
            shop_phone: shopPhone
        }), 
      });

      const json = await res.json();
      if (json.ok) {
        setShowShopModal(false);
        router.refresh();
        router.push("/office");
      } else {
        alert("Failed to update status.");
        setSaving(false);
      }
  }

  const handleCreateFollowUp = () => {
      const noteText = `Follow-up from Service #${request.id.slice(0,8)}:\n\n${findings.join('\n')}`;
      const params = new URLSearchParams({
          vehicleId: v?.id || "",
          customerId: c?.id || "",
          prefillTitle: "Recommended Repairs", 
          prefillDesc: noteText
      });
      router.push(`/office/requests/new?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-20 font-sans text-zinc-900 relative">
      
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

        {/* ✅ CLEAN HEADER - No Invoice Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className={clsx(
              "px-4 py-2 text-sm font-bold rounded-lg border transition-all flex items-center gap-2",
              copying ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-gray-200 text-zinc-600 hover:bg-gray-50"
            )}
          >
            {copying ? <IconCheck /> : <IconShare />}
            {copying ? "Copied" : "Share"}
          </button>
          
          <button
            onClick={handleSave}
            disabled={(!isEditable && !isAtShop) || saving}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {isEditable && (
             <>
                 {/* ✅ SEND TO SHOP BUTTON */}
                 <button
                    onClick={() => setShowShopModal(true)}
                    disabled={saving}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition shadow-sm flex items-center gap-2"
                 >
                    <IconBuilding /> Outsourced
                 </button>

                 <button
                    onClick={handleApprove}
                    disabled={saving}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-black text-white hover:bg-zinc-800 transition shadow-lg flex items-center gap-2"
                 >
                    {saving ? "Processing..." : "Approve & Dispatch"}
                 </button>
             </>
          )}
        </div>
      </header>

      {/* 2️⃣ MAIN GRID (RESTORED TO WIDE LAYOUT) */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (Context) */}
        <div className="lg:col-span-4 space-y-6">
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

          {!isProcurement && (
            <div className="bg-white rounded-xl border border-zinc-200 p-5 flex gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                <IconGauge />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Odometer</p>
                <p className="font-bold text-zinc-900 text-lg">
                    {mileageValue ? `${Number(mileageValue).toLocaleString()} mi` : "—"}
                </p>
              </div>
            </div>
          )}

          {/* ✅ NEW: SHOP DETAILS PANEL (If At Shop) */}
          {isAtShop && (
             <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 flex gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                 <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600">
                     <IconBuilding />
                 </div>
                 <div>
                     <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Outsourced To</p>
                     <p className="font-bold text-amber-900 text-lg">{shopName || "Unknown Shop"}</p>
                     <p className="text-xs text-amber-700 font-medium">{shopPhone || "No phone listed"}</p>
                 </div>
             </div>
          )}
        </div>

        {/* RIGHT COLUMN (Work) */}
        <div className="lg:col-span-8 space-y-6">
          
          {isCompleted && findings.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-6 shadow-sm animate-in slide-in-from-top-4">
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg text-red-600">
                              <IconAlert />
                          </div>
                          <div>
                              <h3 className="font-black text-red-900 text-lg">Technician Recommendations</h3>
                              <p className="text-red-700 text-xs font-medium">Items found during inspection that require attention.</p>
                          </div>
                      </div>
                      <button 
                          onClick={handleCreateFollowUp}
                          className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-zinc-800 transition shadow-lg"
                      >
                          Draft New Request
                      </button>
                  </div>
                  
                  <div className="bg-white rounded-lg border border-red-100 p-4 shadow-sm">
                      {findings.map((finding: string, i: number) => (
                          <div key={i} className="text-sm font-bold text-zinc-800 py-2 border-b border-zinc-50 last:border-0 flex items-center gap-2">
                              {finding}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          <RevenueOptimizer request={request} onUpdate={handleRequestUpdate} />

          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Internal Service Requisition</h3>
            <div className="space-y-4">
                <input
                value={serviceTitle}
                disabled={!isEditable && !isAtShop}
                onChange={(e) => setServiceTitle(e.target.value)}
                placeholder="Service Title"
                className={clsx(
                    "w-full text-2xl font-black outline-none transition",
                    (isEditable || isAtShop) ? "text-zinc-900 border-b border-zinc-200 focus:border-black" : "bg-transparent text-zinc-500 cursor-not-allowed"
                )}
                />
                <textarea
                value={serviceDescription}
                disabled={!isEditable && !isAtShop}
                onChange={(e) => setServiceDescription(e.target.value)}
                rows={5}
                className={clsx(
                    "w-full p-4 rounded-xl text-sm leading-relaxed font-medium transition outline-none resize-none",
                    (isEditable || isAtShop)
                        ? "bg-zinc-50 text-zinc-800 border border-zinc-200 focus:bg-white focus:ring-2 focus:ring-black/5" 
                        : "bg-zinc-50/50 text-zinc-400 border border-transparent cursor-not-allowed"
                )}
                placeholder="Technician instructions, PO numbers, or specific details..."
                />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
              <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Field Documentation</h3>
              <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-wide">Live Feed</span>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase mb-2 block">Technician Notes</label>
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-zinc-600 text-sm italic leading-relaxed whitespace-pre-wrap">
                  {request.technician_notes || "Technician has not submitted findings yet."}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase mb-2 block">Inspection Photos</label>
                <div className="grid grid-cols-4 gap-3">
                  {request.request_images?.map((img: any, i: number) => (
                    <a 
                      key={i} 
                      href={img.url_full || img.image_url} // Fallback support
                      target="_blank" 
                      rel="noreferrer"
                      className="aspect-square rounded-xl overflow-hidden border border-zinc-200 hover:border-blue-500 transition shadow-sm group relative"
                    >
                      <img src={img.url_full || img.image_url} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" alt="Inspection" />
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

      {/* ✅ NEW: SHOP MODAL */}
      {showShopModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl space-y-4">
                  <div>
                      <h2 className="text-xl font-black text-zinc-900">Outsource to Shop</h2>
                      <p className="text-zinc-500 text-sm">Send this request to a third-party vendor.</p>
                  </div>
                  
                  <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Shop Name</label>
                      <input 
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          placeholder="e.g. Firestone, Dealer, etc."
                          className="w-full p-3 rounded-xl border border-zinc-300 font-bold text-sm outline-none focus:ring-2 focus:ring-black"
                      />
                  </div>
                  
                  <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Shop Phone (Optional)</label>
                      <input 
                          value={shopPhone}
                          onChange={(e) => setShopPhone(e.target.value)}
                          placeholder="(555) 123-4567"
                          className="w-full p-3 rounded-xl border border-zinc-300 font-bold text-sm outline-none focus:ring-2 focus:ring-black"
                      />
                  </div>

                  <div className="flex gap-3 pt-2">
                      <button 
                          onClick={() => setShowShopModal(false)}
                          className="flex-1 py-3 rounded-xl border border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50 transition"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handleSendToShop}
                          disabled={!shopName || saving}
                          className="flex-[2] py-3 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 transition shadow-lg disabled:opacity-50"
                      >
                          {saving ? "Updating..." : "Confirm & Send"}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}