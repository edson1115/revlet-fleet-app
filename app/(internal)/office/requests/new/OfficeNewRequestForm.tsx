"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";

// --- ICONS ---
const IconCar = () => <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const IconUser = () => <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconPlus = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

export default function OfficeNewRequestForm({ 
  preselectedCustomer 
}: { 
  preselectedCustomer?: { id: string; name: string } | null 
}) {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ 1. Enable URL Params
  const [loading, setLoading] = useState(false);

  // Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [fmcs, setFmcs] = useState<any[]>([]); 

  // Selection
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomer?.id || "");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  
  // States
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ 
    year: "", make: "", model: "", plate: "", vin: "" 
  });

  // Job Details
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [mileage, setMileage] = useState("");

  // ✅ 2. AUTO-FILL FROM URL (The Bridge from the Tech App)
  useEffect(() => {
      const pCid = searchParams.get("customerId");
      const pVid = searchParams.get("vehicleId");
      const pTitle = searchParams.get("prefillTitle");
      const pDesc = searchParams.get("prefillDesc");

      if (pCid) {
          setSelectedCustomerId(pCid);
          // Trigger vehicle load manually since the useEffect dependency might not catch it instantly
          loadVehiclesForCustomer(pCid);
      }
      if (pVid) setSelectedVehicleId(pVid);
      if (pTitle) setServiceTitle(pTitle);
      if (pDesc) setServiceDesc(pDesc);
  }, [searchParams]);

  // Helper to load vehicles
  async function loadVehiclesForCustomer(cid: string) {
      const res = await fetch(`/api/admin/vehicles?customer_id=${cid}`);
      const js = await res.json();
      if (js.ok) setVehicles(js.rows || []);
  }

  // 3. Load Data (Customers)
  useEffect(() => {
    async function loadData() {
      try {
        const custRes = await fetch("/api/admin/customers?limit=500");
        const custJs = await custRes.json();
        if (custJs.ok) setCustomers(custJs.rows || []);
      } catch (e) {
        console.error("Failed to load form data", e);
      }
    }
    loadData();
  }, []);

  // 4. Load Vehicles when Customer Changes (Manual Selection)
  useEffect(() => {
    if (!selectedCustomerId) {
      setVehicles([]);
      return;
    }
    loadVehiclesForCustomer(selectedCustomerId);
  }, [selectedCustomerId]);

  // Submit Logic
  async function handleSubmit() {
    if (!selectedCustomerId || !serviceTitle) return alert("Customer and Service Title are required.");
    if (!isAddingVehicle && !selectedVehicleId) return alert("Please select a vehicle.");

    setLoading(true);

    try {
        let finalVehicleId = selectedVehicleId;

        // A) Create Vehicle (if new)
        if (isAddingVehicle) {
            if (!newVehicle.year || !newVehicle.make || !newVehicle.model) {
                setLoading(false);
                throw new Error("Year, Make, and Model are required.");
            }
            
            const vehPayload = { ...newVehicle, customer_id: selectedCustomerId };
            const vehRes = await fetch("/api/admin/vehicles/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(vehPayload)
            });
            const vehJs = await vehRes.json();
            if (!vehJs.ok) throw new Error(vehJs.error || "Failed to create vehicle");
            finalVehicleId = vehJs.vehicle.id;
        }

        // B) Create Request
        const res = await fetch("/api/office/requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer_id: selectedCustomerId,
                vehicle_id: finalVehicleId,
                service_title: serviceTitle,
                service_description: serviceDesc, // Internal View
                description: serviceDesc,         // ✅ 3. THE FIX: Also save to Public Customer View
                reported_mileage: mileage ? parseInt(mileage) : null,
                status: "NEW", 
                created_by_role: "OFFICE"
            }),
        });

        const js = await res.json();
        if (js.ok) {
            router.push(`/office/requests/${js.request.id}`);
        } else {
            throw new Error(js.error);
        }

    } catch (e: any) {
        alert("Error: " + e.message);
        setLoading(false);
    }
  }

  // --- VISUAL HELPERS ---
  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
           <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
             <span onClick={() => router.back()} className="hover:text-black cursor-pointer">Requests</span>
             <span>/</span>
             <span className="text-black">New Intake</span>
           </div>
           <h1 className="text-xl font-bold text-black mt-1">Create Work Order</h1>
        </div>
        <div className="flex gap-3">
           <button onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black">Cancel</button>
           <button 
             onClick={handleSubmit} 
             disabled={loading}
             className="px-6 py-2 bg-black text-white text-sm font-bold rounded-lg shadow-lg hover:bg-gray-800 disabled:opacity-50 transition flex items-center gap-2"
           >
             {loading ? <span className="animate-spin">⟳</span> : <span>Create Ticket &rarr;</span>}
           </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === LEFT COLUMN: CONTEXT (Customer & Vehicle) === */}
        <div className="lg:col-span-5 space-y-6">
           
           {/* CUSTOMER CARD */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</h3>
                {preselectedCustomer && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">LOCKED</span>}
             </div>
             <div className="p-4">
                <div className="relative">
                   <div className="absolute left-3 top-3.5"><IconUser /></div>
                   <select 
                     className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:border-black focus:ring-1 focus:ring-black outline-none transition disabled:bg-gray-50 disabled:text-gray-500"
                     value={selectedCustomerId}
                     disabled={!!preselectedCustomer}
                     onChange={(e) => {
                       setSelectedCustomerId(e.target.value);
                       setSelectedVehicleId("");
                       setIsAddingVehicle(false);
                     }}
                   >
                     <option value="">Select a Customer...</option>
                     {preselectedCustomer && !customers.find(c => c.id === preselectedCustomer.id) && (
                        <option value={preselectedCustomer.id}>{preselectedCustomer.name}</option>
                     )}
                     {customers.map((c) => (
                       <option key={c.id} value={c.id}>{c.name}</option>
                     ))}
                   </select>
                </div>
             </div>
           </div>

           {/* VEHICLE CARD */}
           <div className={clsx("bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300", !selectedCustomerId && "opacity-50 pointer-events-none")}>
             <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vehicle Asset</h3>
                <button 
                  onClick={() => setIsAddingVehicle(!isAddingVehicle)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                   {isAddingVehicle ? "Cancel & Select Existing" : <><IconPlus /> New Vehicle</>}
                </button>
             </div>
             
             <div className="p-4">
               {isAddingVehicle ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <div className="grid grid-cols-3 gap-2">
                         <input placeholder="Year" className="p-2 border rounded text-sm font-medium" value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value})} />
                         <input placeholder="Make" className="p-2 border rounded text-sm font-medium" value={newVehicle.make} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})} />
                         <input placeholder="Model" className="p-2 border rounded text-sm font-medium" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <input placeholder="Plate (Optional)" className="p-2 border rounded text-sm" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})} />
                         <input placeholder="VIN (Optional)" className="p-2 border rounded text-sm" value={newVehicle.vin} onChange={e => setNewVehicle({...newVehicle, vin: e.target.value})} />
                      </div>
                  </div>
               ) : (
                  <div className="space-y-4">
                      <div className="relative">
                         <div className="absolute left-3 top-3.5"><IconCar /></div>
                         <select 
                           className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                           value={selectedVehicleId}
                           onChange={(e) => setSelectedVehicleId(e.target.value)}
                         >
                           <option value="">Select Vehicle...</option>
                           {vehicles.map((v) => (
                              <option key={v.id} value={v.id}>
                                 {v.year} {v.make} {v.model} • {v.plate || "No Plate"} {v.unit_number ? `(Unit ${v.unit_number})` : ""}
                              </option>
                           ))}
                         </select>
                      </div>
                      {selectedVehicleData && (
                         <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex gap-3 items-start">
                            <div className="w-10 h-10 rounded bg-white border border-gray-200 flex items-center justify-center text-lg">🚗</div>
                            <div>
                               <div className="font-bold text-sm text-gray-900">{selectedVehicleData.year} {selectedVehicleData.make} {selectedVehicleData.model}</div>
                               <div className="text-xs text-gray-500 font-mono mt-0.5">VIN: {selectedVehicleData.vin || "N/A"}</div>
                               <div className="text-xs text-gray-500 font-mono">Plate: {selectedVehicleData.plate || "N/A"}</div>
                            </div>
                         </div>
                      )}
                  </div>
               )}
             </div>
           </div>
        </div>

        {/* === RIGHT COLUMN: THE JOB (Service Request) === */}
        <div className="lg:col-span-7">
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
              <div className="p-6 space-y-8">
                  <div className="space-y-3">
                     <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block">Service Requirement</label>
                     <input 
                       autoFocus
                       type="text" 
                       className="w-full text-2xl font-bold placeholder-gray-300 border-b-2 border-gray-100 focus:border-black outline-none py-2 transition bg-transparent"
                       placeholder="e.g. 50k Mile Service"
                       value={serviceTitle}
                       onChange={(e) => setServiceTitle(e.target.value)}
                     />
                     <p className="text-xs text-gray-400">Brief title for the dashboard.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition group">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Current Mileage</label>
                        <div className="flex items-center gap-2">
                           <input 
                              type="number"
                              className="w-full bg-transparent font-mono text-lg font-bold outline-none text-gray-900 placeholder-gray-300"
                              placeholder="00000"
                              value={mileage}
                              onChange={(e) => setMileage(e.target.value)}
                           />
                           <span className="text-xs font-bold text-gray-400">mi</span>
                        </div>
                     </div>
                  </div>

                  <div>
                     <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-3">Internal Notes / Instructions</label>
                     <textarea 
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 leading-relaxed outline-none focus:border-black focus:ring-1 focus:ring-black transition h-32 resize-none"
                        placeholder="Enter customer complaints, specific diagnostic instructions, or parts pre-approval info..."
                        value={serviceDesc}
                        onChange={(e) => setServiceDesc(e.target.value)}
                     />
                  </div>

              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-right">
                  <p className="text-xs text-gray-400">This request will appear in the "Action Required" queue instantly.</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}