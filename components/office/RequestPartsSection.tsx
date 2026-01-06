"use client";

import { useState, useEffect } from "react";

// Icons
const IconTrash = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const IconSparkles = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 3.214L13 21l-2.286-6.857L5 12l5.714-3.214L13 3z" /></svg>;
const IconPlus = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

export function RequestPartsSection({ requestId }: { requestId: string }) {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Manual Add State
  const [newPart, setNewPart] = useState({ part_name: "", part_number: "", quantity: 1, vendor: "" });
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  // 1. Fetch Existing Parts
  async function loadParts() {
    try {
        const res = await fetch(`/api/office/requests/${requestId}/parts`);
        const js = await res.json();
        const list = js.rows || js.data || js.parts || [];
        setParts(list);
    } catch (e) {
        console.error("Failed to load parts", e);
        setParts([]);
    }
  }

  useEffect(() => { loadParts(); }, [requestId]);

  // 2. Add Part Logic (Manual)
  async function addPart(overridePart?: any) {
    const partToAdd = overridePart || newPart;
    if (!partToAdd.part_name) return alert("Part Name required");
    
    setLoading(true);
    try {
        const res = await fetch(`/api/office/requests/${requestId}/parts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(partToAdd),
        });
        
        if (res.ok) {
            setNewPart({ part_name: "", part_number: "", quantity: 1, vendor: "" });
            await loadParts();
        } else {
            alert("Server failed to save part.");
        }
    } catch (e) {
        alert("Error adding part");
    }
    setLoading(false);
  }

  // 3. Delete Part
  async function deletePart(id: string) {
    if (!confirm("Remove this part?")) return;
    await fetch(`/api/office/requests/${requestId}/parts?id=${id}`, { method: "DELETE" });
    loadParts();
  }

  // 4. AI Suggestion Logic
  async function fetchAiSuggestions() {
    setAiLoading(true);
    setAiSuggestions([]); 

    try {
        const reqRes = await fetch(`/api/office/requests/${requestId}`);
        const reqData = await reqRes.json();
        
        if (!reqData.ok) {
            alert("Could not load vehicle data.");
            setAiLoading(false);
            return;
        }

        const res = await fetch("/api/ai/suggest-parts", {
            method: "POST",
            body: JSON.stringify({
                vehicle: reqData.request.vehicle,
                service: reqData.request.service_title
            })
        });
        
        const js = await res.json();
        
        if (js.ok && js.parts && Array.isArray(js.parts)) {
            setAiSuggestions(js.parts);
        } else {
            alert("AI could not find parts or returned invalid data.");
        }
    } catch (e) {
        alert("AI Service Unavailable");
    } finally {
        setAiLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
         <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Parts Ordered</h3>
         
         <button 
           onClick={fetchAiSuggestions}
           disabled={aiLoading}
           className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-70"
         >
           {aiLoading ? <span className="animate-spin">✨</span> : <IconSparkles />}
           {aiLoading ? "Consulting AI..." : "AI Suggest Parts"}
         </button>
      </div>

      {/* AI SUGGESTIONS PANEL */}
      {aiSuggestions && aiSuggestions.length > 0 && (
          <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
             <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-indigo-800 uppercase flex items-center gap-2">
                    <IconSparkles /> AI Recommendations
                </h4>
                <button onClick={() => setAiSuggestions([])} className="text-xs text-indigo-400 hover:text-indigo-800">Dismiss</button>
             </div>
             <div className="space-y-2">
                {aiSuggestions.map((p, i) => (
                    <div key={i} className="flex items-center justify-between bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                        <div>
                            <div className="font-bold text-sm text-gray-900">{p.name}</div>
                            <div className="text-xs text-gray-500 font-mono">PN: {p.number} • Qty: {p.qty}</div>
                        </div>
                        <button 
                            onClick={() => {
                                addPart({ part_name: p.name, part_number: p.number, quantity: p.qty, vendor: "AI Suggestion" });
                                setAiSuggestions(prev => prev.filter((_, idx) => idx !== i));
                            }}
                            className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 transition"
                        >
                            <IconPlus />
                        </button>
                    </div>
                ))}
             </div>
          </div>
      )}

      {/* EXISTING PARTS LIST */}
      {(!parts || parts.length === 0) && !loading && (
        <div className="text-sm text-gray-400 italic mb-4">No parts added yet.</div>
      )}

      <div className="space-y-3 mb-6">
        {parts && parts.map((part) => (
          <div key={part.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 group">
             <div className="bg-white w-10 h-10 flex items-center justify-center rounded border border-gray-200 font-bold text-gray-500">
                {part.quantity}
             </div>
             <div className="flex-1">
                <div className="font-bold text-sm text-gray-900">{part.part_name}</div>
                <div className="text-xs text-gray-500 font-mono">
                    {part.part_number || "No P/N"} {part.vendor && <span className="text-gray-300">• {part.vendor}</span>}
                </div>
             </div>
             <button 
               onClick={() => deletePart(part.id)}
               className="text-gray-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition"
             >
                <IconTrash />
             </button>
          </div>
        ))}
      </div>

      {/* MANUAL ADD FORM */}
      <div className="grid grid-cols-12 gap-2">
         <div className="col-span-4">
            <input 
                placeholder="Part #" 
                className="w-full p-2 bg-gray-50 border rounded-lg text-sm"
                value={newPart.part_number}
                onChange={e => setNewPart({...newPart, part_number: e.target.value})}
            />
         </div>
         <div className="col-span-5">
            <input 
                placeholder="Description" 
                className="w-full p-2 bg-gray-50 border rounded-lg text-sm"
                value={newPart.part_name}
                onChange={e => setNewPart({...newPart, part_name: e.target.value})}
            />
         </div>
         <div className="col-span-2">
            <input 
                type="number"
                placeholder="Qty" 
                className="w-full p-2 bg-gray-50 border rounded-lg text-sm text-center"
                // ✅ CRITICAL FIX: Handle NaN by defaulting to '' for the input
                value={newPart.quantity || ""}
                onChange={e => {
                    const val = parseInt(e.target.value);
                    setNewPart({...newPart, quantity: isNaN(val) ? 0 : val});
                }}
            />
         </div>
         <button 
           onClick={() => addPart()} 
           disabled={loading}
           className="col-span-1 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition"
         >
           <IconPlus />
         </button>
      </div>

    </div>
  );
}