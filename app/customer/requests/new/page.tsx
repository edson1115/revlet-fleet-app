"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
// ✅ Import the new browser client factory
import { supabaseBrowser } from "@/lib/db/browser"; 

// --- ICONS ---
const IconCheck = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const IconCar = () => <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;

export default function NewRequestPage() {
  const router = useRouter();
  const supabase = supabaseBrowser(); 
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function loadFleetData() {
      try {
        // 1. Refresh session to ensure valid 3-part JWT
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error("Auth session missing:", sessionError);
          router.push("/login");
          return;
        }

        const user = session.user;

        // 2. Extract Customer ID (Priority: Metadata > Profile Table)
        let customerId = user.user_metadata?.customer_id;

        if (!customerId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("customer_id")
            .eq("id", user.id)
            .single();
          customerId = profile?.customer_id;
        }
        
        if (!customerId) {
          console.error("CRITICAL: No customer ID linked");
          setLoading(false);
          return;
        }

        // 3. Fetch vehicles with stringified error logging for RLS debugging
        const { data: vehs, error: fetchError } = await supabase
          .from("vehicles")
          .select("*")
          .eq("customer_id", customerId);

        if (fetchError) {
          console.error("SUPABASE FETCH ERROR:", JSON.stringify(fetchError, null, 2));
          throw fetchError;
        }

        if (vehs) {
          setVehicles(vehs);
          if (vehs.length === 1) setSelectedVehicleId(vehs[0].id);
        }

      } catch (e: any) {
        console.error("Error loading fleet logic:", e.message || e);
      } finally {
        setLoading(false);
      }
    }
    loadFleetData();
  }, [supabase, router]);

  async function handleSubmit() {
    if (!selectedVehicleId || !serviceType) return;
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      
      const { error } = await supabase.from("service_requests").insert({
        customer_id: vehicle.customer_id,
        vehicle_id: selectedVehicleId,
        service_title: serviceType,
        description: description,
        status: "NEW",
        created_by: session?.user?.id,
        created_by_role: "CUSTOMER"
      });

      if (error) {
        console.error("Insert error:", JSON.stringify(error, null, 2));
        throw error;
      }
      
      router.push("/customer"); 
    } catch (e: any) {
      alert(`Error creating request: ${e.message || "Check console"}`);
      setSubmitting(false);
    }
  }

  const SERVICES = [
    { id: "Oil Change", label: "Oil Change", icon: "🛢️" },
    { id: "Tire Rotation", label: "Tire Service", icon: "🛞" },
    { id: "Brakes", label: "Brakes", icon: "🛑" },
    { id: "Battery", label: "Battery", icon: "🔋" },
    { id: "Check Engine", label: "Check Engine", icon: "⚠️" },
    { id: "Other", label: "Other / General", icon: "🔧" }
  ];

  if (loading) return (
    <div className="p-10 text-center text-zinc-400 font-bold animate-pulse uppercase tracking-widest text-xs h-screen flex items-center justify-center">
      Establishing secure link to fleet...
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-full min-h-screen bg-white">
      <div className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-black mb-6 flex items-center gap-2 transition">
            &larr; Back to Dashboard
          </button>
          
          <h1 className="text-4xl font-black text-zinc-900 mb-2 tracking-tighter uppercase italic">New Service Request</h1>
          <p className="text-zinc-500 mb-10 text-lg font-medium">Schedule maintenance for your fleet assets.</p>
          
          <div className="space-y-12">
            <section>
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">1. Select Vehicle Asset</h3>
              {vehicles.length === 0 ? (
                <div className="p-8 bg-zinc-50 border border-zinc-100 rounded-[2rem] text-zinc-500 text-sm font-bold text-center italic">
                  No vehicles found in your fleet directory. Contact Admin if this is an error.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map(v => (
                    <div 
                      key={v.id}
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={clsx(
                        "p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all relative overflow-hidden",
                        selectedVehicleId === v.id ? "border-black bg-zinc-50 shadow-lg" : "border-zinc-100 hover:border-zinc-300 bg-white"
                      )}
                    >
                      {selectedVehicleId === v.id && (
                        <div className="absolute top-3 right-3 bg-black text-white p-1 rounded-full shadow-md animate-in zoom-in-50">
                          <IconCheck />
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <div className={clsx("p-3 rounded-xl", selectedVehicleId === v.id ? "bg-white text-black" : "bg-zinc-100 text-zinc-400")}>
                          <IconCar />
                        </div>
                        <div>
                          <div className="font-black text-zinc-900 leading-none mb-1 text-sm">{v.year} {v.make} {v.model}</div>
                          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{v.plate || 'No Plate'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">2. Service Required</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SERVICES.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setServiceType(s.id)} 
                    className={clsx(
                      "p-6 rounded-[1.5rem] border-2 font-black uppercase tracking-widest text-[10px] transition-all flex flex-col items-center gap-3",
                      serviceType === s.id ? "border-black bg-black text-white shadow-xl scale-105" : "border-zinc-100 text-zinc-500 hover:bg-zinc-50 bg-white"
                    )}
                  >
                    <span className="text-3xl filter grayscale brightness-125">{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">3. Notes / Issue Details</h3>
              <textarea 
                className="w-full p-6 bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] focus:border-black focus:bg-white outline-none transition font-bold text-zinc-900 min-h-[150px] placeholder:text-zinc-300 text-sm"
                placeholder="Briefly describe the vehicle issue or maintenance required..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </section>

            <button 
              onClick={handleSubmit} 
              disabled={!selectedVehicleId || !serviceType || submitting} 
              className="w-full py-6 bg-black text-white font-black uppercase tracking-widest text-xs rounded-[2rem] shadow-2xl hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-300 transition transform active:scale-[0.98]"
            >
              {submitting ? "Transmitting Request..." : "Submit Service Request"}
            </button>
          </div>
        </div>
      </div>
      
      <div className="hidden md:flex w-80 bg-zinc-900 text-white p-12 flex-col justify-between sticky top-0 h-screen shadow-2xl">
         <div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl mb-8">⚡</div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4 leading-none">Revlet<br/>Service</h2>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">
              Your request is routed directly to local technicians for immediate scheduling. Most jobs are completed within 24 hours.
            </p>
         </div>
         <div className="space-y-1">
            <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Station</div>
            <div className="text-xs font-black italic uppercase tracking-widest">San Antonio / TX</div>
         </div>
      </div>
    </div>
  );
}