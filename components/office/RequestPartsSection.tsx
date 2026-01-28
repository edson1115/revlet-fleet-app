"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx"; // ✅ FIXED: Added missing import

// --- ICONS ---
const IconTrash = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const IconPlus = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const IconSearch = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconSparkles = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 3.214L13 21l-2.286-6.857L5 12l5.714-3.214L13 3z" /></svg>;
const IconPackage = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconPencil = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const IconClock = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export function RequestPartsSection({ 
  requestId, 
  vehicleContext, 
  serviceContext 
}: { 
  requestId: string;
  vehicleContext?: any;
  serviceContext?: string;
}) {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Mode can be PART or LABOR
  const [addMode, setAddMode] = useState<"PART" | "LABOR" | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  // Package State
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);

  // Settings State (Labor Rate)
  const [shopLaborRate, setShopLaborRate] = useState(125); // Default fallback

  // Draft States
  const [draftPart, setDraftPart] = useState({
    inventory_id: "",
    part_name: "",
    part_number: "",
    quantity: 1
  });

  const [draftLabor, setDraftLabor] = useState({
    description: "Labor",
    hours: 1.0,
    rate: 125
  });

  // Load Parts & Settings
  useEffect(() => {
    loadParts();
    loadSettings();
  }, [requestId]);

  async function loadSettings() {
      try {
          const res = await fetch("/api/office/settings");
          const data = await res.json();
          if (data && data.labor_rate) {
              setShopLaborRate(data.labor_rate);
              setDraftLabor(prev => ({ ...prev, rate: data.labor_rate }));
          }
      } catch (e) { console.error("Could not load labor rate"); }
  }

  async function loadParts() {
    setLoading(true);
    fetch(`/api/office/requests/${requestId}/parts`)
      .then(r => r.json())
      .then(d => {
        if(d.ok || d.parts) setParts(d.parts || d.rows || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  // Inventory Search Logic
  useEffect(() => {
    if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
    }
    const timer = setTimeout(() => {
        fetch(`/api/office/inventory/search?q=${searchQuery}`)
            .then(r => r.json())
            .then(d => setSearchResults(d.results || []));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectInventoryItem = (item: any) => {
      setDraftPart({
          inventory_id: item.id,
          part_name: item.part_name,
          part_number: item.part_number,
          quantity: 1
      });
      setSearchQuery(""); 
      setSearchResults([]);
  };

  // 🤖 AI LOGIC
  async function handleConsultAI() {
      if (!vehicleContext || !serviceContext) return alert("Vehicle and Service Title are needed for AI suggestions.");
      setAiLoading(true);
      try {
          const res = await fetch("/api/ai/suggest-parts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ vehicle: vehicleContext, service: serviceContext })
          });
          const js = await res.json();
          if (js.ok) {
              setAiSuggestions(js.parts);
              setAddMode("PART");
          } else {
              alert("AI could not make a recommendation.");
          }
      } catch (e) { alert("AI Error"); }
      setAiLoading(false);
  }

  // 📦 PACKAGE LOGIC
  async function openPackageModal() {
      setShowPackageModal(true);
      const res = await fetch("/api/office/packages");
      const d = await res.json();
      if(d.packages) setPackages(d.packages);
  }

  async function applyPackage(pkgId: string) {
      const selectedPkg = packages.find(p => p.id === pkgId);
      if (!selectedPkg) return;
      if (!confirm(`Load '${selectedPkg.name}'?`)) return;

      const res = await fetch(`/api/office/requests/${requestId}/packages/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ package_id: pkgId })
      });

      if(res.ok) {
          setShowPackageModal(false);
          loadParts(); 
      } else {
          alert("Failed to apply package");
      }
  }

  // ✅ SAVE ITEM (Part or Labor)
  async function handleAddItem() {
    let payload;

    if (addMode === "LABOR") {
        if (!draftLabor.description) return alert("Labor description required");
        payload = {
            part_name: draftLabor.description,
            part_number: "LABOR", // Marker for frontend to style differently
            quantity: draftLabor.hours, // Save Hours as Quantity
            price: draftLabor.rate,     // Save Rate as Price
            request_id: requestId
        };
    } else {
        // Normal Part
        payload = {
            ...draftPart,
            part_name: draftPart.part_name || searchQuery,
            request_id: requestId
        };
        if (!payload.part_name) return alert("Part name is required");
    }

    const res = await fetch(`/api/office/requests/${requestId}/parts/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (json.ok) {
        setParts([...parts, json.part]);
        setAddMode(null);
        // Reset forms
        setDraftPart({ inventory_id: "", part_name: "", part_number: "", quantity: 1 });
        setDraftLabor({ description: "Labor", hours: 1.0, rate: shopLaborRate });
        setSearchQuery("");
    } else {
        alert("Failed to add item");
    }
  }

  // Delete Part
  async function handleDelete(partId: string) {
      if(!confirm("Remove this item?")) return;
      const res = await fetch(`/api/office/requests/${requestId}/parts/${partId}`, { method: "DELETE" });
      if(res.ok) setParts(parts.filter(p => p.id !== partId));
  }

  // Edit Logic
  async function handleSaveEdit() {
      if(!editingPart) return;
      const res = await fetch(`/api/office/requests/${requestId}/parts/${editingPart.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              part_name: editingPart.part_name,
              quantity: parseFloat(editingPart.quantity),
              price: parseFloat(editingPart.price)
          })
      });
      if(res.ok) {
          setShowEditModal(false);
          setEditingPart(null);
          loadParts();
      }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
       
       {/* HEADER */}
       <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">Parts & Labor</h3>
          
          <div className="flex gap-2">
            <button onClick={openPackageModal} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold transition">
                <IconPackage /> Bundle
            </button>

            <button onClick={handleConsultAI} disabled={aiLoading} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-bold transition disabled:opacity-50">
                {aiLoading ? <span className="animate-spin">✨</span> : <IconSparkles />}
                {aiLoading ? "Thinking..." : "AI"}
            </button>

            {/* ✅ ADD LABOR BUTTON */}
            <button onClick={() => setAddMode("LABOR")} className="text-xs bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200 transition flex items-center gap-1">
                <IconClock /> Labor
            </button>

            {/* ADD PART BUTTON */}
            <button onClick={() => setAddMode("PART")} className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-bold hover:bg-gray-800 transition flex items-center gap-1">
                <IconPlus /> Part
            </button>
          </div>
       </div>

       {/* AI SUGGESTIONS */}
       {aiSuggestions.length > 0 && (
           <div className="mb-6 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-4 animate-in fade-in">
               <div className="flex justify-between items-center mb-3">
                   <h4 className="text-xs font-bold text-indigo-900 uppercase flex items-center gap-2">
                       <IconSparkles /> Recommended Parts
                   </h4>
                   <button onClick={() => setAiSuggestions([])} className="text-xs text-indigo-400 hover:text-indigo-800">Close</button>
               </div>
               <div className="space-y-2">
                   {aiSuggestions.map((p, i) => (
                       <div key={i} className="flex items-center justify-between bg-white/80 p-2.5 rounded-lg border border-indigo-50 shadow-sm hover:border-indigo-200 transition">
                           <div>
                               <div className="font-bold text-sm text-gray-900">{p.name}</div>
                               <div className="text-xs text-gray-500 font-mono">{p.number}</div>
                           </div>
                           <button onClick={() => { setDraftPart({ inventory_id: "", part_name: p.name, part_number: p.number, quantity: p.qty }); setSearchQuery(p.name); setAiSuggestions([]); }} className="bg-indigo-600 text-white p-1.5 rounded-md hover:bg-indigo-700 transition">
                               <IconPlus />
                           </button>
                       </div>
                   ))}
               </div>
           </div>
       )}

       {/* ✅ INPUT FORM (SWITCHES BETWEEN PART & LABOR) */}
       {addMode && (
           <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl relative animate-in fade-in slide-in-from-top-2">
               
               {/* 🛠️ PART INPUT MODE */}
               {addMode === "PART" && (
                   <>
                       <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Part Search or Custom Name</label>
                       {!draftPart.part_name ? (
                           <div className="relative">
                               <div className="absolute left-3 top-2.5 text-gray-400"><IconSearch /></div>
                               <input 
                                   autoFocus
                                   type="text" 
                                   className="w-full pl-9 p-2 border rounded-lg text-sm font-bold outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                                   placeholder="e.g. 1024-AF or 'Air Filter'"
                                   value={searchQuery}
                                   onChange={e => setSearchQuery(e.target.value)}
                               />
                               {searchResults.length > 0 && (
                                   <div className="absolute top-full left-0 right-0 bg-white border shadow-xl rounded-lg mt-1 z-50 max-h-48 overflow-y-auto">
                                       {searchResults.map(item => (
                                           <div key={item.id} onClick={() => selectInventoryItem(item)} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                                               <div className="font-bold text-sm text-gray-900">{item.part_name}</div>
                                               <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                                                   <span>#{item.part_number}</span>
                                                   <span className={item.quantity > 0 ? "text-green-600 font-bold" : "text-red-500 font-bold"}>{item.quantity} in stock</span>
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                               )}
                           </div>
                       ) : (
                           <div className="flex justify-between items-center bg-white p-3 border border-green-200 rounded-lg mb-2 shadow-sm">
                               <div>
                                   <div className="font-bold text-sm text-gray-900">{draftPart.part_name}</div>
                                   <div className="text-xs text-gray-500 font-mono">#{draftPart.part_number}</div>
                               </div>
                               <button onClick={() => setDraftPart({ inventory_id: "", part_name: "", part_number: "", quantity: 1 })} className="text-xs text-red-500 font-bold hover:underline">Change</button>
                           </div>
                       )}
                       <div className="mt-3 w-24">
                           <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Qty</label>
                           <input 
                               type="number" 
                               className="w-full p-2 border rounded-lg text-center text-sm font-bold focus:border-black outline-none"
                               value={draftPart.quantity}
                               onChange={e => setDraftPart({...draftPart, quantity: parseInt(e.target.value) || 1})}
                           />
                       </div>
                   </>
               )}

               {/* ⏱️ LABOR INPUT MODE */}
               {addMode === "LABOR" && (
                   <>
                       <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Labor Description</label>
                       <input 
                           autoFocus
                           type="text" 
                           className="w-full p-2 border rounded-lg text-sm font-bold outline-none focus:border-black focus:ring-1 focus:ring-black transition mb-3"
                           placeholder="e.g. Diagnostic Time, Installation, etc."
                           value={draftLabor.description}
                           onChange={e => setDraftLabor({...draftLabor, description: e.target.value})}
                       />
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Hours</label>
                               <input 
                                   type="number" step="0.1"
                                   className="w-full p-2 border rounded-lg text-center text-sm font-bold focus:border-black outline-none"
                                   value={draftLabor.hours}
                                   onChange={e => setDraftLabor({...draftLabor, hours: parseFloat(e.target.value) || 0})}
                               />
                           </div>
                           <div>
                               <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Rate ($/hr)</label>
                               <input 
                                   type="number" 
                                   className="w-full p-2 border rounded-lg text-center text-sm font-bold focus:border-black outline-none bg-gray-100 text-gray-600"
                                   value={draftLabor.rate}
                                   onChange={e => setDraftLabor({...draftLabor, rate: parseFloat(e.target.value) || 0})}
                               />
                           </div>
                       </div>
                       <div className="mt-3 text-right text-sm font-bold text-green-600">
                           Total: ${(draftLabor.hours * draftLabor.rate).toFixed(2)}
                       </div>
                   </>
               )}

               {/* SAVE ACTIONS */}
               <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                   <button onClick={() => setAddMode(null)} className="px-4 py-2 text-sm text-gray-500 font-bold hover:text-black transition">Cancel</button>
                   <button onClick={handleAddItem} className="px-6 py-2 bg-black text-white text-sm font-bold rounded-lg shadow-lg hover:bg-gray-800 transition">
                       Add {addMode === "LABOR" ? "Labor" : "Part"}
                   </button>
               </div>
           </div>
       )}

       {/* LIST */}
       {loading ? (
           <div className="text-sm text-gray-400 animate-pulse">Loading items...</div>
       ) : (!parts || parts.length === 0) ? (
           <div className="text-sm text-gray-400 italic text-center py-4 border border-dashed border-gray-200 rounded-lg">No items added yet.</div>
       ) : (
           <div className="space-y-2">
               {parts.map((part) => {
                   // ✅ DETECT IF LABOR
                   const isLabor = part.part_number === "LABOR";

                   return (
                       <div key={part.id} className={clsx("flex justify-between items-center p-3 rounded-lg border group transition", isLabor ? "bg-amber-50 border-amber-100 hover:border-amber-300" : "bg-gray-50 border-gray-100 hover:border-gray-300")}>
                           <div className="flex items-center gap-3">
                               {isLabor ? (
                                   <div className="bg-amber-200 text-amber-800 w-8 h-8 flex items-center justify-center rounded-full font-bold shadow-sm">
                                       <IconClock />
                                   </div>
                               ) : (
                                   <div className="bg-white border border-gray-200 w-8 h-8 flex items-center justify-center rounded font-bold text-xs shadow-sm text-gray-700">
                                       {part.quantity}
                                   </div>
                               )}
                               
                               <div>
                                   <div className="font-bold text-sm text-gray-900">{part.part_name}</div>
                                   <div className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-2">
                                       {isLabor ? (
                                           <>
                                               <span className="font-bold text-amber-700">{part.quantity} hrs</span>
                                               <span className="text-gray-300">@</span>
                                               <span>${(part.price || 0).toFixed(2)}/hr</span>
                                           </>
                                       ) : (
                                           <>
                                               <span>{part.part_number || "Custom Item"}</span>
                                               <span className="text-gray-300">|</span>
                                               <span>${(part.price || 0).toFixed(2)} ea</span>
                                           </>
                                       )}
                                   </div>
                               </div>
                           </div>
                           
                           {/* ACTIONS */}
                           <div className="flex items-center gap-3">
                                <div className="text-sm font-bold text-gray-900">
                                    ${(part.quantity * (part.price || 0)).toFixed(2)}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={() => { setEditingPart(part); setShowEditModal(true); }} className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition"><IconPencil /></button>
                                    <button onClick={() => handleDelete(part.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"><IconTrash /></button>
                                </div>
                           </div>
                       </div>
                   );
               })}
           </div>
       )}

       {/* 📦 PACKAGE MODAL (Same as before) */}
       {showPackageModal && (
           <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                   <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                       <h2 className="font-bold text-lg flex items-center gap-2"><IconPackage /> Select Bundle</h2>
                       <button onClick={() => setShowPackageModal(false)} className="text-gray-400 hover:text-black">✕</button>
                   </div>
                   <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                       {packages.map(pkg => (
                           <div key={pkg.id} onClick={() => applyPackage(pkg.id)} className="border border-gray-200 p-4 rounded-xl hover:border-purple-400 hover:shadow-md cursor-pointer transition group">
                               <div className="flex justify-between items-start mb-1">
                                   <div className="font-bold text-gray-900">{pkg.name}</div>
                                   <div className="text-xs bg-gray-100 px-2 py-1 rounded font-bold text-gray-500 group-hover:bg-purple-50 group-hover:text-purple-600 transition">{(pkg.items?.length || 0)} Items</div>
                               </div>
                               <div className="text-xs text-gray-500">{pkg.description || "No description"}</div>
                           </div>
                       ))}
                       {packages.length === 0 && <div className="text-center py-10 text-gray-400 italic">No packages found.</div>}
                   </div>
               </div>
           </div>
       )}

       {/* ✏️ EDIT MODAL (Handles both Parts & Labor) */}
       {showEditModal && editingPart && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
                   <h3 className="font-bold text-gray-900 mb-4">{editingPart.part_number === "LABOR" ? "Edit Labor" : "Edit Part"}</h3>
                   
                   <div className="space-y-4">
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">{editingPart.part_number === "LABOR" ? "Description" : "Part Name"}</label>
                           <input 
                             className="w-full p-2 border border-gray-300 rounded font-bold"
                             value={editingPart.part_name}
                             onChange={e => setEditingPart({...editingPart, part_name: e.target.value})}
                           />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="text-xs font-bold text-gray-500 uppercase">{editingPart.part_number === "LABOR" ? "Hours" : "Qty"}</label>
                               <input 
                                  type="number" step={editingPart.part_number === "LABOR" ? "0.1" : "1"}
                                  className="w-full p-2 border border-gray-300 rounded font-bold"
                                  value={editingPart.quantity}
                                  onChange={e => setEditingPart({...editingPart, quantity: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="text-xs font-bold text-gray-500 uppercase">{editingPart.part_number === "LABOR" ? "Rate ($/hr)" : "Price ($)"}</label>
                               <input 
                                  type="number" step="0.01"
                                  className="w-full p-2 border border-gray-300 rounded font-bold"
                                  value={editingPart.price}
                                  onChange={e => setEditingPart({...editingPart, price: e.target.value})}
                               />
                           </div>
                       </div>
                   </div>

                   <div className="flex gap-2 mt-6">
                       <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                       <button onClick={handleSaveEdit} className="flex-1 py-3 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-800">Save Changes</button>
                   </div>
               </div>
           </div>
       )}

    </div>
  );
}