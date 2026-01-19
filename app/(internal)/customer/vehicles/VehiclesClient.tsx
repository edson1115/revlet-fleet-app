"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import clsx from "clsx";

// --- ICONS ---
const IconGrid = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IconList = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const IconSearch = () => <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconX = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconPlus = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const IconTrash = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const IconSparkles = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 3.214L13 21l-2.286-6.857L5 12l5.714-3.214z" /></svg>;

// ✅ EXACT MATCH to the SQL ENUM
const FMC_OPTIONS = [
  "LMR",
  "Element",
  "Enterprise Fleet",
  "Merchants Fleet",
  "Holman",
  "EAN",
  "Hertz",
  "Fleetio",
  "Wheels / LeasePlan",
  "Emkay",
  "Penske",
  "Ryder",
  "Other"
];

export default function VehiclesClient({ vehicles, customerId }: { vehicles: any[], customerId: string }) {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("list");
  const [search, setSearch] = useState("");
  const [activeVehicle, setActiveVehicle] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ RENAMED 'current_mileage' to 'mileage' to match DB
  const [newVehicle, setNewVehicle] = useState({
      year: new Date().getFullYear() + 1,
      make: "",
      model: "",
      plate: "",
      vin: "",
      unit_number: "",
      mileage: "", // <--- FIXED
      fmc_account: ""
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const filtered = vehicles.filter(v => 
    v.plate?.toLowerCase().includes(search.toLowerCase()) ||
    v.vin?.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase())
  );

  const checkPendingRequests = async (vehicleId: string) => {
      const { data } = await supabase
        .from("service_requests")
        .select("id")
        .eq("vehicle_id", vehicleId)
        .neq("status", "COMPLETED")
        .neq("status", "CANCELED");
      
      return data && data.length > 0;
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      const payload = {
          ...newVehicle,
          fmc_account: newVehicle.fmc_account || null,
          // ✅ MAP to 'mileage' column
          mileage: Number(newVehicle.mileage) || 0,
          unit_number: newVehicle.unit_number || null,
      };

      const { error } = await supabase.from("vehicles").insert({
          customer_id: customerId,
          ...payload
      });

      if (!error) {
          setIsAdding(false);
          setNewVehicle({ year: 2026, make: "", model: "", plate: "", vin: "", unit_number: "", mileage: "", fmc_account: "" });
          router.refresh();
      } else {
          console.error("Add Vehicle Error:", error);
          alert(`Error: ${error.message || "Check that Plate/VIN is unique and FMC is valid."}`);
      }
      setLoading(false);
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
      const hasActiveJobs = await checkPendingRequests(vehicleId);
      if (hasActiveJobs) {
          alert("🚫 ACTION BLOCKED\n\nThis vehicle has active Service Requests. You must complete or cancel them before deleting this asset.");
          return;
      }

      if (!confirm("Are you sure? This cannot be undone.")) return;

      const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);
      
      if (!error) {
          setActiveVehicle(null);
          router.refresh();
      } else {
          alert("Error deleting vehicle.");
      }
  };

  const handleUpdateMileage = async () => {
      const hasActiveJobs = await checkPendingRequests(activeVehicle.id);
      if (hasActiveJobs) {
        alert("🚫 ACTION BLOCKED\n\nThis vehicle has an active Service Request. Mileage must be updated by the Technician during service.");
        return;
      }

      // ✅ Use 'mileage' from DB
      const currentVal = activeVehicle.mileage || 0;
      const newMiles = prompt("Enter new odometer reading:", currentVal);
      
      if (!newMiles || isNaN(Number(newMiles))) return;
      
      if (Number(newMiles) < Number(currentVal)) {
          alert("Error: New mileage cannot be lower than current.");
          return;
      }

      // ✅ Update 'mileage' column
      const { error } = await supabase.from("vehicles").update({ mileage: newMiles }).eq("id", activeVehicle.id);
      if (!error) {
          router.refresh();
          setActiveVehicle({ ...activeVehicle, mileage: newMiles }); 
      }
  };

  const handleUpdateFMC = async () => {
      const fmcListString = FMC_OPTIONS.join("\n");
      const newFMC = prompt(`Enter Exact FMC Name from list:\n\n${fmcListString}`, activeVehicle.fmc_account || "");
      
      if (newFMC === null) return; 
      
      if (!FMC_OPTIONS.includes(newFMC) && newFMC !== "") {
          alert("Invalid Selection. You must type the name exactly as shown.");
          return;
      }

      const updateValue = newFMC === "" ? null : newFMC;

      const { error } = await supabase.from("vehicles").update({ fmc_account: updateValue }).eq("id", activeVehicle.id);
      if (!error) {
          router.refresh();
          setActiveVehicle({ ...activeVehicle, fmc_account: updateValue }); 
      } else {
          alert("Error updating FMC.");
      }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] p-8 pb-20 font-sans text-zinc-900 relative">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
           <div>
               <h1 className="text-3xl font-black text-zinc-900">My Vehicles</h1>
               <p className="text-zinc-500 font-medium">Manage {vehicles.length} active assets</p>
           </div>
           
           <div className="flex gap-2 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                   <div className="absolute left-3 top-2.5 text-zinc-400"><IconSearch /></div>
                   <input 
                      placeholder="Search Fleet..." 
                      className="pl-10 pr-4 py-2.5 w-full bg-white border border-zinc-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-black/5 transition"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                   />
               </div>
               
               <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:shadow-black/20 hover:bg-zinc-800 transition flex items-center gap-2"
               >
                  <IconPlus /> <span>Add Vehicle</span>
               </button>

               <div className="bg-white border border-zinc-200 rounded-xl p-1 flex">
                   <button onClick={() => setView("grid")} className={clsx("p-2 rounded-lg transition", view === 'grid' ? "bg-black text-white" : "text-zinc-400 hover:text-black")}><IconGrid /></button>
                   <button onClick={() => setView("list")} className={clsx("p-2 rounded-lg transition", view === 'list' ? "bg-black text-white" : "text-zinc-400 hover:text-black")}><IconList /></button>
               </div>
           </div>
        </div>

        {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200 border-dashed text-zinc-400">
                No vehicles found.
            </div>
        ) : view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {filtered.map(v => (
                  <div key={v.id} onClick={() => setActiveVehicle(v)} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300 transition cursor-pointer group">
                     <div className="flex justify-between items-start mb-4">
                         <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest bg-zinc-100 px-2 py-1 rounded">{v.plate}</div>
                         <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
                     </div>
                     <div className="text-xl font-black text-zinc-900 group-hover:text-blue-600 transition">{v.year} {v.make} {v.model}</div>
                     <div className="text-xs text-zinc-500 mt-1 font-mono">VIN: {v.vin}</div>
                  </div>
               ))}
            </div>
        ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Vehicle</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Plate / VIN</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Unit #</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {filtered.map(v => (
                            <tr key={v.id} onClick={() => setActiveVehicle(v)} className="hover:bg-zinc-50 cursor-pointer transition">
                                <td className="px-6 py-4 font-bold text-zinc-900">{v.year} {v.make} {v.model}</td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-zinc-700">{v.plate}</div>
                                    <div className="text-[10px] text-zinc-400 font-mono">{v.vin}</div>
                                </td>
                                <td className="px-6 py-4 font-mono text-zinc-500">{v.unit_number || "—"}</td>
                                <td className="px-6 py-4 text-right text-zinc-400">→</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {activeVehicle && (
          <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setActiveVehicle(null)} />
            <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-zinc-900">{activeVehicle.year} {activeVehicle.model}</h2>
                        <div className="flex gap-2 mt-2">
                             <span className="bg-black text-white px-3 py-1 rounded text-xs font-bold">{activeVehicle.plate}</span>
                             <span className="bg-zinc-100 text-zinc-500 px-3 py-1 rounded text-xs font-bold">Unit #{activeVehicle.unit_number || "N/A"}</span>
                        </div>
                    </div>
                    <button onClick={() => setActiveVehicle(null)} className="p-2 hover:bg-zinc-100 rounded-full transition"><IconX /></button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                    <button 
                        onClick={() => router.push(`/customer/requests/new?vehicle_id=${activeVehicle.id}`)}
                        className="col-span-2 bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95"
                    >
                        Schedule Service
                    </button>
                    <button 
                        onClick={handleUpdateMileage}
                        className="bg-zinc-100 text-zinc-600 py-3 rounded-xl font-bold text-xs hover:bg-zinc-200 transition"
                    >
                        Update Mileage
                    </button>
                    <button 
                        onClick={handleUpdateFMC}
                        className="bg-zinc-100 text-zinc-600 py-3 rounded-xl font-bold text-xs hover:bg-zinc-200 transition"
                    >
                        Update FMC
                    </button>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5 mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-indigo-600"><IconSparkles /></span>
                        <span className="text-xs font-black text-indigo-900 uppercase tracking-widest">AI Fleet Insight</span>
                    </div>
                    <p className="text-sm text-indigo-800 font-medium leading-relaxed">
                        Based on the last service date, this vehicle is due for a 
                        <span className="font-bold"> Tire Rotation</span> and <span className="font-bold">Oil Analysis</span> within the next 500 miles.
                    </p>
                    <button className="mt-3 text-[10px] font-black bg-white text-indigo-600 px-3 py-1.5 rounded shadow-sm hover:shadow uppercase tracking-wide">
                        Generate Report
                    </button>
                </div>

                <div className="space-y-6 border-t border-zinc-100 pt-6">
                    <div>
                        <span className="block text-zinc-400 text-[10px] font-bold uppercase mb-1">Fleet Management</span>
                        <div className="font-bold text-zinc-900">{activeVehicle.fmc_account || "Private / None"}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="block text-zinc-400 text-[10px] font-bold uppercase mb-1">Mileage</span>
                            {/* ✅ Use 'mileage' here */}
                            <div className="font-mono font-bold text-zinc-900">{activeVehicle.mileage || "0"}</div>
                        </div>
                        <div>
                            <span className="block text-zinc-400 text-[10px] font-bold uppercase mb-1">VIN</span>
                            <div className="font-mono text-zinc-600 text-xs break-all">{activeVehicle.vin}</div>
                        </div>
                    </div>

                    <div className="pt-10">
                         <button 
                            onClick={() => handleDeleteVehicle(activeVehicle.id)}
                            className="w-full border border-red-200 text-red-600 py-3 rounded-xl font-bold text-xs hover:bg-red-50 transition flex items-center justify-center gap-2"
                         >
                            <IconTrash /> Remove Vehicle from Fleet
                         </button>
                         <p className="text-[10px] text-zinc-400 text-center mt-2">Only possible if no active jobs exist.</p>
                    </div>
                </div>
            </div>
          </>
      )}

      {isAdding && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-black text-zinc-900">Add New Asset</h2>
                      <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-zinc-100 rounded-full"><IconX /></button>
                  </div>
                  
                  <form onSubmit={handleAddVehicle} className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                          <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Year</label>
                              <input required type="number" className="w-full p-3 bg-zinc-50 rounded-xl font-bold border-zinc-200 border" value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: parseInt(e.target.value)})} />
                          </div>
                          <div className="col-span-2">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Make</label>
                              <input required placeholder="Ford, Ram..." className="w-full p-3 bg-zinc-50 rounded-xl font-bold border-zinc-200 border" value={newVehicle.make} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})} />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Model</label>
                              <input required placeholder="Transit, F-150..." className="w-full p-3 bg-zinc-50 rounded-xl font-bold border-zinc-200 border" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Plate</label>
                              <input required placeholder="ABC-1234" className="w-full p-3 bg-zinc-50 rounded-xl font-bold border-zinc-200 border uppercase" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value.toUpperCase()})} />
                          </div>
                      </div>

                      <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">VIN</label>
                          <input required placeholder="17 Character VIN" className="w-full p-3 bg-zinc-50 rounded-xl font-bold border-zinc-200 border uppercase font-mono" value={newVehicle.vin} onChange={e => setNewVehicle({...newVehicle, vin: e.target.value.toUpperCase()})} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Unit # (Optional)</label>
                              <input placeholder="#101" className="w-full p-3 bg-zinc-50 rounded-xl font-bold border-zinc-200 border" value={newVehicle.unit_number} onChange={e => setNewVehicle({...newVehicle, unit_number: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Current Mileage</label>
                              {/* ✅ Fixed Input Mapping */}
                              <input type="number" placeholder="0" className="w-full p-3 bg-zinc-50 rounded-xl font-bold border-zinc-200 border" value={newVehicle.mileage} onChange={e => setNewVehicle({...newVehicle, mileage: e.target.value})} />
                          </div>
                      </div>

                      <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">FMC Account (Optional)</label>
                          <select 
                            className="w-full p-3 bg-zinc-50 rounded-xl font-bold border-zinc-200 border" 
                            value={newVehicle.fmc_account} 
                            onChange={e => setNewVehicle({...newVehicle, fmc_account: e.target.value})}
                          >
                              <option value="">None / Private</option>
                              {FMC_OPTIONS.map(fmc => (
                                <option key={fmc} value={fmc}>{fmc}</option>
                              ))}
                          </select>
                      </div>

                      <button type="submit" disabled={loading} className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg mt-2">
                          {loading ? "Adding..." : "Add Vehicle to Fleet"}
                      </button>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
}