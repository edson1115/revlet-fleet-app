"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// --- ICONS ---
const IconPlus = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const IconPackage = () => <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconTrash = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

export default function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newPkg, setNewPkg] = useState({ name: "", description: "", base_labor_hours: 0 });
  const [newItems, setNewItems] = useState<any[]>([]);
  
  // Temp Item State for the form
  const [draftItem, setDraftItem] = useState({ part_name: "", part_number: "", quantity: 1 });

  // Load Packages
  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    setLoading(true);
    const res = await fetch("/api/office/packages");
    const d = await res.json();
    if(d.ok) setPackages(d.packages);
    setLoading(false);
  }

  // Add Item to Draft List
  function addDraftItem() {
      if(!draftItem.part_name) return alert("Part Name Required");
      setNewItems([...newItems, { ...draftItem, id: Date.now() }]); // Temp ID
      setDraftItem({ part_name: "", part_number: "", quantity: 1 });
  }

  // Save Entire Package
  async function handleCreate() {
      if(!newPkg.name) return alert("Package Name Required");
      
      const res = await fetch("/api/office/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newPkg, items: newItems })
      });

      const d = await res.json();
      if(d.ok) {
          setShowModal(false);
          setNewPkg({ name: "", description: "", base_labor_hours: 0 });
          setNewItems([]);
          loadPackages(); // Refresh list
      } else {
          alert("Failed to create package");
      }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
       
       {/* === BRANDED HEADER === */}
       <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
             {/* Logo / Home Link */}
             <div 
               onClick={() => router.push("/office")}
               className="bg-black text-white px-3 py-1 rounded text-xl font-black tracking-tighter italic cursor-pointer hover:bg-gray-800 transition"
             >
               REVLET
             </div>
             <div className="h-6 w-px bg-gray-200"></div>
             
             {/* Context Title */}
             <div>
                 <h1 className="font-bold text-gray-900 leading-none flex items-center gap-2">
                   Service Packages
                 </h1>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                   <span onClick={() => router.push("/office")} className="cursor-pointer hover:text-black transition">Office Dashboard</span>
                   <span>/</span>
                   <span onClick={() => router.push("/office/inventory")} className="cursor-pointer hover:text-black transition">Inventory</span>
                   <span>/</span>
                   <span>Bundle Manager</span>
                 </div>
             </div>
          </div>

          <button 
             onClick={() => setShowModal(true)}
             className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 transition flex items-center gap-2"
          >
             <IconPlus /> New Bundle
          </button>
       </div>

       {/* CONTENT */}
       <div className="max-w-5xl mx-auto p-8">
          
          {/* LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                  <div key={pkg.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-purple-300 transition group cursor-pointer h-full flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg leading-tight">{pkg.name}</h3>
                          <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-500 whitespace-nowrap">{pkg.items?.length || 0} Items</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4 flex-1">{pkg.description || "No description."}</p>
                      
                      {/* Preview Items */}
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          {pkg.items?.slice(0, 3).map((item: any) => (
                              <div key={item.id} className="text-xs text-gray-600 flex justify-between border-b border-gray-200 pb-1 last:border-0">
                                  <span className="font-medium truncate pr-2">{item.part_name}</span>
                                  <span className="font-mono text-gray-400">x{item.quantity}</span>
                              </div>
                          ))}
                          {(pkg.items?.length || 0) > 3 && (
                              <div className="text-[10px] text-purple-600 font-bold uppercase tracking-wide text-center pt-1">+ {(pkg.items?.length || 0) - 3} more parts</div>
                          )}
                          {(pkg.items?.length || 0) === 0 && (
                              <div className="text-xs text-gray-400 italic text-center">Empty Package</div>
                          )}
                      </div>
                  </div>
              ))}
          </div>

          {!loading && packages.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-400 font-bold">No packages defined yet.</p>
                  <p className="text-xs text-gray-300 mt-1">Create bundles like "Oil Change Special" to speed up workflow.</p>
              </div>
          )}
       </div>

       {/* CREATE MODAL */}
       {showModal && (
           <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 flex flex-col max-h-[90vh]">
                   
                   {/* Modal Header */}
                   <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                       <h2 className="font-bold text-lg flex items-center gap-2"><IconPackage /> Create Service Package</h2>
                       <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">✕</button>
                   </div>

                   {/* Modal Body */}
                   <div className="p-6 overflow-y-auto">
                       <div className="grid grid-cols-2 gap-4 mb-4">
                           <div className="col-span-2">
                               <label className="text-[10px] font-bold uppercase text-gray-500">Package Name</label>
                               <input 
                                   className="w-full p-2 border rounded-lg font-bold" 
                                   placeholder="e.g. Ford 5.0L Oil Change" 
                                   value={newPkg.name}
                                   onChange={e => setNewPkg({...newPkg, name: e.target.value})}
                               />
                           </div>
                           <div className="col-span-2">
                               <label className="text-[10px] font-bold uppercase text-gray-500">Description</label>
                               <input 
                                   className="w-full p-2 border rounded-lg text-sm" 
                                   placeholder="e.g. includes filter, 8qts oil, drain plug" 
                                   value={newPkg.description}
                                   onChange={e => setNewPkg({...newPkg, description: e.target.value})}
                               />
                           </div>
                       </div>

                       <div className="border-t border-gray-100 pt-4">
                           <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Package Contents (Parts)</h3>
                           
                           {/* Add Item Row */}
                           <div className="flex gap-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                               <input 
                                   className="flex-1 p-2 border rounded text-sm" 
                                   placeholder="Part Name (e.g. Oil Filter)" 
                                   value={draftItem.part_name}
                                   onChange={e => setDraftItem({...draftItem, part_name: e.target.value})}
                               />
                               <input 
                                   className="w-24 p-2 border rounded text-sm" 
                                   placeholder="Part #" 
                                   value={draftItem.part_number}
                                   onChange={e => setDraftItem({...draftItem, part_number: e.target.value})}
                               />
                               <input 
                                   type="number"
                                   className="w-16 p-2 border rounded text-center text-sm" 
                                   value={draftItem.quantity}
                                   onChange={e => setDraftItem({...draftItem, quantity: parseInt(e.target.value) || 1})}
                               />
                               <button 
                                   onClick={addDraftItem}
                                   className="bg-black text-white px-3 rounded font-bold text-sm hover:bg-gray-800"
                               >
                                   + Add
                               </button>
                           </div>

                           {/* Added Items List */}
                           <div className="space-y-2">
                               {newItems.map((item, idx) => (
                                   <div key={idx} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-0">
                                       <div className="text-sm font-bold text-gray-800">
                                           {item.part_name} 
                                           <span className="text-gray-400 font-normal ml-2 text-xs">#{item.part_number}</span>
                                       </div>
                                       <div className="flex items-center gap-4">
                                           <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">x{item.quantity}</span>
                                           <button onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                                               <IconTrash />
                                           </button>
                                       </div>
                                   </div>
                               ))}
                               {newItems.length === 0 && (
                                   <div className="text-center text-gray-400 text-xs italic py-2">No items added to this package yet.</div>
                               )}
                           </div>
                       </div>
                   </div>

                   {/* Footer */}
                   <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                       <button onClick={() => setShowModal(false)} className="text-sm font-bold text-gray-500 hover:text-black px-4">Cancel</button>
                       <button 
                           onClick={handleCreate}
                           className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-purple-700"
                       >
                           Save Package
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
}