"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import VehicleAIBrain from "./VehicleAIBrain"; // 👈 Import the AI Brain

// --- ICONS ---
const IconSpinner = () => <svg className="animate-spin w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const IconTool = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const IconSparkles = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;

type Props = {
  vehicleId: string;
  open: boolean;
  onClose: () => void;
};

export default function VehicleDrawer({ vehicleId, open, onClose }: Props) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mileage, setMileage] = useState("");
  const [savingMileage, setSavingMileage] = useState(false);
  const [aiOpen, setAiOpen] = useState(false); // 👈 State for AI Drawer

  // 1. Initialize Client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 2. Fetch Data Directly
  useEffect(() => {
    if (!open || !vehicleId) return;

    async function loadData() {
      setLoading(true);
      try {
        // A. Get Vehicle Details
        const { data: v, error: vErr } = await supabase
            .from("vehicles")
            .select("*")
            .eq("id", vehicleId)
            .single();

        if (vErr) throw vErr;
        setVehicle(v);
        setMileage(v.last_reported_mileage || v.mileage_override || "");

        // B. Get Service History
        const { data: h, error: hErr } = await supabase
            .from("service_requests")
            .select("id, status, service_title, created_at")
            .eq("vehicle_id", vehicleId)
            .order("created_at", { ascending: false });

        if (hErr) console.error("History Error:", hErr);
        setHistory(h || []);

      } catch (err) {
        console.error("Drawer Load Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [open, vehicleId, supabase]);

  async function saveMileage() {
    if(!vehicleId) return;
    setSavingMileage(true);
    
    const { error } = await supabase
        .from("vehicles")
        .update({ last_reported_mileage: parseInt(mileage) || 0 })
        .eq("id", vehicleId);

    setSavingMileage(false);
    
    if (!error) {
        alert("Mileage saved.");
        router.refresh();
    } else {
        alert("Error saving mileage");
    }
  }

  // Hide if not open
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
        {/* BACKDROP */}
        <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={onClose}
        />

        {/* DRAWER PANEL */}
        <div className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* LOADING STATE */}
            {loading || !vehicle ? (
                <div className="h-full flex items-center justify-center flex-col gap-4">
                    <IconSpinner />
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Loading Asset Data...</p>
                </div>
            ) : (
                <>
                    {/* HEADER */}
                    <div className="px-6 py-8 bg-zinc-50 border-b border-zinc-100">
                        <div className="flex items-start justify-between">
                            <h2 className="text-2xl font-black text-zinc-900 uppercase italic leading-none">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                            </h2>
                            <button onClick={onClose} className="rounded-full bg-white p-2 hover:bg-zinc-200 transition">
                                ✕
                            </button>
                        </div>
                        <div className="mt-2 flex gap-3 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                            <span className="bg-white border px-2 py-1 rounded text-zinc-800">{vehicle.plate || "NO PLATE"}</span>
                            <span>VIN: {vehicle.vin}</span>
                        </div>
                    </div>

                    {/* BODY */}
                    <div className="flex-1 px-6 py-6 space-y-8">
                        
                        {/* 1. AI BUTTON (New!) */}
                        <button 
                          onClick={() => setAiOpen(true)}
                          className="w-full py-4 bg-zinc-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:bg-zinc-700 transition flex items-center justify-center gap-2"
                        >
                            <IconSparkles /> Run AI Diagnostics
                        </button>

                        {/* 2. REQUEST SERVICE */}
                        <button 
                          onClick={() => router.push('/customer/requests/new')}
                          className="w-full py-4 border-2 border-zinc-900 text-zinc-900 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-zinc-50 transition flex items-center justify-center gap-2"
                        >
                            <IconTool /> Request Service
                        </button>

                        {/* 3. MILEAGE */}
                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Update Mileage</label>
                            <div className="flex gap-2">
                                <input 
                                    value={mileage}
                                    onChange={e => setMileage(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg border text-sm font-bold outline-none focus:border-black transition"
                                    placeholder="Current Odo"
                                />
                                <button onClick={saveMileage} disabled={savingMileage} className="bg-zinc-900 text-white px-4 rounded-lg text-xs font-bold uppercase hover:bg-zinc-700 transition">
                                    {savingMileage ? "..." : "Save"}
                                </button>
                            </div>
                        </div>

                        {/* 4. HISTORY */}
                        <div>
                            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Service History ({history.length})</h3>
                            {history.length === 0 ? (
                                <div className="p-6 text-center border-2 border-dashed border-zinc-100 rounded-2xl text-xs text-zinc-400">No history found.</div>
                            ) : (
                                <div className="space-y-3">
                                    {history.map(req => (
                                        <div 
                                            key={req.id}
                                            onClick={() => router.push(`/customer/requests/${req.id}`)}
                                            className="p-4 border rounded-xl hover:border-black cursor-pointer transition flex justify-between items-center group"
                                        >
                                            <div>
                                                <div className="font-bold text-sm text-zinc-900">{req.service_title}</div>
                                                <div className="text-[10px] text-zinc-400">{new Date(req.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-[10px] font-black bg-zinc-100 px-2 py-1 rounded uppercase group-hover:bg-black group-hover:text-white transition">
                                                {req.status}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* AI COMPONENT (Hidden until clicked) */}
            <VehicleAIBrain 
                open={aiOpen} 
                onClose={() => setAiOpen(false)} 
                vehicle={vehicle} 
            />
        </div>
    </div>
  );
}