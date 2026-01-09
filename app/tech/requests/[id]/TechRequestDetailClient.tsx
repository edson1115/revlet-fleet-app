"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

// --- ICONS ---
const IconBack = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const IconCheck = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const IconAlert = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const IconPhone = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const IconCamera = () => <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

export default function TechRequestDetailClient({ request }: { request: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(request.status);
  const [images, setImages] = useState(request.request_images || []);
  const [techNotes, setTechNotes] = useState(request.technician_notes || "");
  
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueReason, setIssueReason] = useState("No Keys / Keys Missing");

  // --- ACTIONS ---
  const handleStatusUpdate = async (action: "START" | "COMPLETE") => {
    if (!confirm(action === "START" ? "Start this job?" : "Mark job as complete?")) return;
    performUpdate(action);
  };

  const performUpdate = async (action: string, payload: any = {}) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tech/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(data.request?.status);
      setShowIssueModal(false);
      if (action === "REPORT_ISSUE" || action === "COMPLETE") router.push("/tech");
      else router.refresh(); 
    } catch (e: any) { alert(e.message); } 
    finally { setLoading(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/tech/requests/${request.id}/photos`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.ok) setImages([{ image_url: data.url }, ...images]);
    } catch (err) { alert("Upload failed"); } 
    finally { setUploading(false); }
  };

  const saveNotes = async () => {
    await fetch(`/api/tech/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "UPDATE_NOTES", notes: techNotes }),
    });
  };

  const isStarted = status === "IN_PROGRESS";
  const isCompleted = status === "COMPLETED";

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans selection:bg-blue-500">
      
      {/* HEADER */}
      <div className="bg-zinc-900/80 backdrop-blur-md px-4 py-4 sticky top-0 z-30 border-b border-zinc-800 flex items-center gap-4 shadow-xl">
        <button onClick={() => router.back()} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 active:scale-90 transition">
          <IconBack />
        </button>
        <div>
          <h1 className="font-black text-lg leading-none tracking-tight">{request.vehicle?.year} {request.vehicle?.model}</h1>
          <div className="flex items-center gap-2 mt-1">
             <span className="bg-white text-black text-[9px] font-black px-1.5 py-0.5 rounded-sm font-mono uppercase">
                {request.plate || request.vehicle?.plate || "NO PLATE"}
             </span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        
        {/* ACTIONS */}
        {!isCompleted && (
          <div className="space-y-4">
            <button
                disabled={loading}
                onClick={() => handleStatusUpdate(isStarted ? "COMPLETE" : "START")}
                className={clsx(
                    "w-full py-6 rounded-2xl font-black text-2xl uppercase italic tracking-tighter transition-all active:scale-[0.96] shadow-2xl flex items-center justify-center gap-3",
                    loading ? "opacity-50 cursor-wait" : "",
                    isStarted ? "bg-green-600 text-white shadow-green-900/20" : "bg-blue-600 text-white shadow-blue-900/20"
                )}
            >
                {loading ? "Updating..." : isStarted ? "Finish Job" : "Start Job"}
                {!loading && <IconCheck />}
            </button>
          </div>
        )}

        {/* DOCUMENTATION */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Vehicle Photos</h3>
            {uploading && <span className="text-blue-500 text-[10px] font-bold animate-pulse">UPLOADING...</span>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="aspect-square bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer active:bg-zinc-800 transition">
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} disabled={uploading} />
                <IconCamera />
                <span className="text-[9px] font-bold mt-2 text-zinc-500 uppercase">Camera</span>
            </label>
            {images.map((img: any, i: number) => (
                <div key={i} className="aspect-square bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700">
                    <img src={img.image_url} className="w-full h-full object-cover" alt="Service" />
                </div>
            ))}
          </div>
        </div>

        {/* NOTES */}
        <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Inspection Notes</h3>
            <textarea 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-300 focus:border-blue-500 focus:ring-0 min-h-[120px] resize-none"
              placeholder="Type notes for office/customer here..."
              value={techNotes}
              onChange={(e) => setTechNotes(e.target.value)}
              onBlur={saveNotes}
            />
        </div>

        {/* PARTS */}
        {request.request_parts?.length > 0 && (
            <div className="space-y-3">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Parts List</h3>
                <div className="space-y-2">
                    {request.request_parts.map((part: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                            <div>
                                <div className="font-bold text-white text-sm">{part.part_name}</div>
                                <div className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">{part.part_number}</div>
                            </div>
                            <div className="bg-white text-black w-8 h-8 flex items-center justify-center rounded-lg font-black">
                               {part.quantity}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* ISSUE MODAL */}
      {showIssueModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in">
              <div className="bg-zinc-900 w-full max-w-sm rounded-[2rem] p-8 border border-zinc-800 shadow-2xl text-center">
                  <div className="bg-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><IconAlert /></div>
                  <h3 className="font-black text-2xl uppercase italic tracking-tighter text-white">Issue Found?</h3>
                  <div className="space-y-2 my-6">
                      {["No Keys", "Wrong Parts", "Other"].map((reason) => (
                          <button key={reason} onClick={() => setIssueReason(reason)} className={clsx("w-full py-4 rounded-xl border text-sm font-bold transition-all", issueReason === reason ? "border-red-500 bg-red-500/10 text-red-500" : "border-zinc-800 text-zinc-500")}>{reason}</button>
                      ))}
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setShowIssueModal(false)} className="flex-1 text-zinc-500 font-bold">Cancel</button>
                      <button onClick={() => performUpdate("REPORT_ISSUE", { reason: issueReason })} className="flex-1 py-4 bg-red-600 text-white font-black rounded-xl">Alert</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}