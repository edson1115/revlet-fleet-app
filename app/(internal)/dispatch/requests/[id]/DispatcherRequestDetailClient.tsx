"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { REQUEST_STATUS, RequestStatusKey } from "@/lib/requestStatus";

// --- ICONS ---
const IconBack = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const IconUser = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconUsers = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const IconClipboard = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const IconCalendar = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

const toneChip = (tone: string) =>
  tone === "emerald" ? "bg-emerald-100 text-emerald-700" :
  tone === "blue" ? "bg-blue-100 text-blue-700" :
  tone === "amber" ? "bg-amber-100 text-amber-700" :
  tone === "red" ? "bg-red-100 text-red-700" :
  "bg-zinc-100 text-zinc-700";

// Format date for datetime-local input (YYYY-MM-DDTHH:mm)
const formatDateForInput = (dateString: string | null) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const pad = (n: number) => n < 10 ? `0${n}` : n;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function DispatcherRequestDetailClient({ 
  request, 
  technicians 
}: { 
  request: any; 
  technicians: any[]; 
}) {
  const router = useRouter();

  // State for Actions
  const [status, setStatus] = useState<string>(request.status);
  const [leadTech, setLeadTech] = useState(request.technician_id || "");
  const [buddyTech, setBuddyTech] = useState(request.second_technician_id || "");
  const [scheduledAt, setScheduledAt] = useState(formatDateForInput(request.scheduled_at)); // ✅ New Date State
  const [internalNote, setInternalNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Status Meta
  const statusMeta = useMemo(() => {
      const key = (status as RequestStatusKey) || "NEW";
      return REQUEST_STATUS[key] || { label: status, tone: "zinc", description: "" };
  }, [status]);

  async function handleSave() {
    if (!leadTech && status === "SCHEDULED") {
        alert("You must assign a Lead Technician before scheduling.");
        return;
    }
    
    // Validate Date if scheduled
    if (status === "SCHEDULED" && !scheduledAt) {
        if(!confirm("You are setting this to SCHEDULED without a specific date. Continue?")) return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/dispatch/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          technician_id: leadTech || null,
          second_technician_id: buddyTech || null,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null, // ✅ Send Date
        }),
      });

      if (!res.ok) throw new Error("Save failed");
      router.refresh();
    } catch (e) {
      alert("Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function addInternalNote() {
      if(!internalNote) return;
      setSaving(true);
      // In a real app, you'd POST this to a notes table
      setTimeout(() => {
          setInternalNote("");
          setSaving(false);
          alert("Internal note logged.");
      }, 500);
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-20 font-sans text-zinc-900">
      
      {/* TOP HEADER */}
      <header className="bg-white border-b border-zinc-200 px-8 py-5 flex items-start justify-between sticky top-0 z-20 shadow-sm/50">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-black mb-2 transition">
            <IconBack /> Back to Queue
          </button>

          <h1 className="text-2xl font-black text-zinc-900">
            {request.vehicle
              ? `${request.vehicle.year} ${request.vehicle.make} ${request.vehicle.model}`
              : request.service_title}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-mono bg-zinc-100 px-2 py-1 rounded text-zinc-600 border border-zinc-200 font-bold">{request.vehicle?.plate || "N/A"}</span>
            <span className="text-zinc-300">•</span>
            {/* ✅ FIXED: HUGE Customer Name */}
            <span className="font-black text-lg text-indigo-900">{request.customer?.name || "Customer"}</span>
          </div>
        </div>

        <span className={clsx("inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide", toneChip(statusMeta.tone))}>
          {statusMeta.label}
        </span>
      </header>

      <div className="max-w-[1600px] mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Context & Data */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Service Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
            <div className="text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-3">Scope of Work</div>
            <div className="text-xl font-bold text-zinc-900 mb-4">{request.service_title}</div>
            
            <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-100">
                <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Office Instructions</div>
                <div className="text-sm text-zinc-700 leading-relaxed font-medium whitespace-pre-wrap">
                    {request.service_description || request.description || "No specific instructions provided."}
                </div>
            </div>

            {request.office_notes && (
                <div className="mt-6 pt-6 border-t border-zinc-100">
                    <div className="text-[10px] uppercase font-bold text-zinc-400 mb-2 flex items-center gap-2">
                        <IconClipboard /> Internal Office Notes
                    </div>
                    <p className="text-sm text-zinc-600 italic bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                        "{request.office_notes}"
                    </p>
                </div>
            )}
          </div>

          {/* Parts Manifest */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-zinc-900">Parts Manifest</h3>
                  <span className="text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-500 font-bold">Required for Job</span>
              </div>
              
              {request.request_parts && request.request_parts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {request.request_parts.map((p: any) => (
                          <div key={p.id} className="flex justify-between items-center p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                              <div>
                                  <div className="font-bold text-zinc-900 text-sm">{p.part_name}</div>
                                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{p.part_number || "NO P/N"}</div>
                              </div>
                              <div className="text-sm font-black text-zinc-900 bg-white px-3 py-1 rounded border border-zinc-200 shadow-sm">x{p.quantity}</div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="p-8 text-center border-2 border-dashed border-zinc-100 rounded-xl">
                      <p className="text-sm text-zinc-400 font-bold">No parts specified.</p>
                  </div>
              )}
          </div>

        </div>

        {/* RIGHT COLUMN: Action Panel */}
        <div className="space-y-6">
          
          {/* Control Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-black" />
            <h3 className="font-black text-zinc-900 mb-6 uppercase tracking-widest text-xs">Dispatch Controls</h3>

            {/* Lead Tech */}
            <div className="mb-5">
              <div className="text-[10px] uppercase font-bold text-zinc-400 mb-2 flex items-center gap-2">
                  <IconUser /> Lead Technician
              </div>
              <select
                value={leadTech}
                onChange={(e) => setLeadTech(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-black outline-none appearance-none"
              >
                <option value="">Unassigned</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>

            {/* Buddy Tech */}
            <div className="mb-5">
              <div className="text-[10px] uppercase font-bold text-purple-400 mb-2 flex items-center gap-2">
                  <IconUsers /> Buddy / Support (Optional)
              </div>
              <select
                value={buddyTech}
                onChange={(e) => setBuddyTech(e.target.value)}
                className="w-full bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
              >
                <option value="">No Buddy Needed</option>
                {technicians.map((t) => (
                   t.id !== leadTech && <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>

            {/* Workflow Status */}
            <div className="mb-6">
              <div className="text-[10px] uppercase font-bold text-zinc-400 mb-2">Workflow Status</div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
              >
                {Object.keys(REQUEST_STATUS).map((k) => (
                  <option key={k} value={k}>
                    {REQUEST_STATUS[k as RequestStatusKey]?.label || k}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ DATE PICKER (Visible when Scheduled) */}
            {status === 'SCHEDULED' && (
                <div className="mb-6 animate-in fade-in zoom-in duration-200">
                    <div className="text-[10px] uppercase font-bold text-blue-500 mb-2 flex items-center gap-2">
                        <IconCalendar /> Appointment Time
                    </div>
                    <input 
                        type="datetime-local" 
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="w-full bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className={clsx(
                "w-full py-4 rounded-xl font-bold text-sm transition shadow-lg flex items-center justify-center gap-2",
                saving ? "bg-zinc-100 text-zinc-400" : "bg-black text-white hover:bg-zinc-800 active:scale-[0.98]"
              )}
            >
              {saving ? "Saving..." : "Confirm & Save Changes"}
            </button>
          </div>

          {/* Quick Note */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-zinc-900 mb-3 text-sm">Add Internal Note</h3>
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Visible to office/dispatch only..."
              className="w-full min-h-[80px] bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none mb-3"
            />
            <button
              onClick={addInternalNote}
              disabled={saving || !internalNote.trim()}
              className="w-full py-2 bg-white border border-zinc-200 text-zinc-700 font-bold rounded-lg text-xs hover:bg-zinc-50 transition"
            >
              Log Note
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}