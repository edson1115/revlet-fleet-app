"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// --- ICONS ---
const IconCheck = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const IconCar = () => <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;

export default function NewRequestPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function loadVehicles() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error("No user found");
                setLoading(false);
                return;
            }

            // 1. Get Profile -> Customer ID
            const { data: profile } = await supabase.from("profiles").select("customer_id").eq("id", user.id).single();
            
            if (!profile?.customer_id) {
                console.error("No customer ID linked");
                setLoading(false);
                return;
            }

            // 2. Get Vehicles
            const { data: vehs, error } = await supabase
                .from("vehicles")
                .select("*")
                .eq("customer_id", profile.customer_id);

            if (vehs) {
                setVehicles(vehs);
                // If only one vehicle, auto-select it
                if (vehs.length === 1) setSelectedVehicleId(vehs[0].id);
            }
        } catch (e) {
            console.error("Error loading fleet:", e);
        } finally {
            // ✅ CRITICAL FIX: Always turn off loading, no matter what happens
            setLoading(false);
        }
    }
    loadVehicles();
  }, [supabase]);

  async function handleSubmit() {
      if (!selectedVehicleId || !serviceType) return;
      setSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      
      const { error } = await supabase.from("service_requests").insert({
          customer_id: vehicle.customer_id,
          vehicle_id: selectedVehicleId,
          service_title: serviceType,
          description: description,
          status: "NEW",
          created_by: user?.id,
          created_by_role: "CUSTOMER"
      });

      if (!error) {
          router.push("/customer"); // Go back to dashboard
      } else {
          alert("Error creating request");
          setSubmitting(false);
      }
  }

  // --- SERVICE TYPES ---
  const SERVICES = [
      { id: "Oil Change", label: "Oil Change", icon: "🛢️" },
      { id: "Tire Rotation", label: "Tire Service", icon: "🛞" },
      { id: "Brakes", label: "Brakes", icon: "🛑" },
      { id: "Battery", label: "Battery", icon: "🔋" },
      { id: "Check Engine", label: "Check Engine", icon: "⚠️" },
      { id: "Other", label: "Other / General", icon: "🔧" }
  ];

  if (loading) return <div className="p-10 text-center text-gray-400 font-bold animate-pulse">Loading fleet data...</div>;

  return (
    <div className="flex flex-col md:flex-row h-full">
        
        {/* LEFT: FORM AREA */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => router.back()} className="text-gray-400 text-sm font-bold hover:text-black mb-6 flex items-center gap-2 transition">
                    &larr; Cancel & Back
                </button>

                <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">New Service Request</h1>
                <p className="text-gray-500 mb-10 text-lg">Let's get your vehicle back on the road.</p>

                <div className="space-y-10">
                    
                    {/* STEP 1: VEHICLE */}
                    <section>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">1. Select Vehicle Asset</h3>
                        {vehicles.length === 0 ? (
                            <div className="p-6 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold">
                                No vehicles found. Please add a vehicle to your fleet first.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {vehicles.map(v => (
                                    <div 
                                        key={v.id}
                                        onClick={() => setSelectedVehicleId(v.id)}
                                        className={clsx(
                                            "p-4 rounded-xl border-2 cursor-pointer transition-all relative group",
                                            selectedVehicleId === v.id 
                                                ? "border-black bg-gray-50 shadow-md" 
                                                : "border-gray-100 hover:border-gray-300 bg-white"
                                        )}
                                    >
                                        {selectedVehicleId === v.id && (
                                            <div className="absolute top-3 right-3 bg-black text-white p-1 rounded-full shadow-lg">
                                                <IconCheck />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-4">
                                            <div className={clsx("p-3 rounded-lg", selectedVehicleId === v.id ? "bg-white text-black" : "bg-gray-100 text-gray-400")}>
                                                <IconCar />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{v.year} {v.model}</div>
                                                <div className="text-xs font-mono text-gray-500 mt-0.5">{v.plate}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button 
                            onClick={() => router.push('/customer/vehicles/new')}
                            className="mt-4 text-xs font-bold text-gray-400 hover:text-black transition flex items-center gap-1"
                        >
                            + Add another vehicle
                        </button>
                    </section>

                    {/* STEP 2: SERVICE */}
                    <section>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">2. Service Required</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {SERVICES.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setServiceType(s.id)}
                                    className={clsx(
                                        "p-4 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-2 text-center",
                                        serviceType === s.id 
                                            ? "border-black bg-black text-white shadow-lg transform scale-105" 
                                            : "border-gray-100 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                    )}
                                >
                                    <span className="text-2xl">{s.icon}</span>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* STEP 3: DETAILS */}
                    <section>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">3. Notes / Issues</h3>
                        <textarea 
                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-black focus:bg-white outline-none transition font-medium min-h-[120px]"
                            placeholder="Describe the issue or request specific maintenance..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </section>

                    {/* SUBMIT */}
                    <button 
                        onClick={handleSubmit}
                        disabled={!selectedVehicleId || !serviceType || submitting}
                        className="w-full py-5 bg-blue-600 text-white font-black text-lg rounded-2xl shadow-xl hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none transition transform active:scale-[0.98]"
                    >
                        {submitting ? "Processing..." : "Submit Service Request"}
                    </button>

                </div>
            </div>
        </div>

        {/* RIGHT: INFO PANEL (Hidden on Mobile) */}
        <div className="hidden md:flex w-96 bg-gray-900 text-white p-10 flex-col justify-between sticky top-0 h-screen">
            <div>
                <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-6">🛡️</div>
                <h2 className="text-2xl font-bold mb-4">Revlet Guarantee</h2>
                <p className="text-gray-400 leading-relaxed mb-8">
                    Our certified technicians arrive fully equipped. Most requests are scheduled within 24 hours of submission.
                </p>

                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-green-500/20 text-green-400 p-2 rounded-lg">✓</div>
                        <div>
                            <div className="font-bold">Transparent Pricing</div>
                            <div className="text-sm text-gray-500">No hidden fees or upcharges.</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg">✓</div>
                        <div>
                            <div className="font-bold">Real-time Tracking</div>
                            <div className="text-sm text-gray-500">Watch your technician arrive.</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-xs text-gray-600 font-mono">
                Support: (555) 123-4567 <br/>
                ID: REF-{Math.floor(Math.random() * 10000)}
            </div>
        </div>

    </div>
  );
}