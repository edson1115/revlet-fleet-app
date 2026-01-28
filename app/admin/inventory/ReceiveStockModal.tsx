"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function ReceiveStockModal({ onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  
  const [form, setForm] = useState({
      quantity: 10,
      cost_per_unit: 0,
      vendor: ""
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Search for Parts
  useEffect(() => {
      const doSearch = async () => {
          if(search.length < 2) return;
          const { data } = await supabase
            .from("inventory")
            .select("id, part_name, part_number, stock")
            .ilike("part_name", `%${search}%`)
            .limit(5);
          setResults(data || []);
      };
      const timer = setTimeout(doSearch, 300);
      return () => clearTimeout(timer);
  }, [search]);

  // 2. Submit Restock
  const handleSubmit = async () => {
      if(!selectedPart) return;
      setLoading(true);

      const res = await fetch("/api/admin/inventory/receive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              part_id: selectedPart.id,
              ...form
          })
      });

      if(res.ok) {
          alert(`Successfully added ${form.quantity} units!`);
          onSuccess();
          onClose();
      } else {
          alert("Error receiving stock.");
      }
      setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                <h2 className="text-xl font-black italic tracking-tighter uppercase">Receive Shipment</h2>
                <button onClick={onClose} className="text-zinc-400 hover:text-black font-bold">✕</button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
                
                {/* PART SEARCH */}
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Search Part</label>
                    {!selectedPart ? (
                        <div className="relative">
                            <input 
                                className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl font-bold"
                                placeholder="Type tire size or part name..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                            {results.length > 0 && (
                                <div className="absolute top-full left-0 w-full bg-white border border-zinc-200 shadow-xl rounded-xl mt-2 overflow-hidden z-10">
                                    {results.map(r => (
                                        <button 
                                            key={r.id}
                                            onClick={() => { setSelectedPart(r); setSearch(""); }}
                                            className="w-full text-left p-3 hover:bg-blue-50 border-b border-zinc-50 last:border-0 flex justify-between group"
                                        >
                                            <span className="font-bold text-zinc-800">{r.part_name}</span>
                                            <span className="text-xs text-zinc-400 font-mono group-hover:text-blue-600">Current: {r.stock}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex justify-between items-center">
                            <div>
                                <div className="font-black text-blue-900">{selectedPart.part_name}</div>
                                <div className="text-xs text-blue-600 font-mono">{selectedPart.part_number}</div>
                            </div>
                            <button onClick={() => setSelectedPart(null)} className="text-xs font-bold text-blue-400 hover:text-blue-600">Change</button>
                        </div>
                    )}
                </div>

                {/* QUANTITY INPUTS */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Quantity Received</label>
                        <input 
                            type="number" 
                            className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl font-black text-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={form.quantity}
                            onChange={e => setForm({...form, quantity: parseInt(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Vendor (Optional)</label>
                        <input 
                            className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl font-bold"
                            placeholder="e.g. Michelin"
                            value={form.vendor}
                            onChange={e => setForm({...form, vendor: e.target.value})}
                        />
                    </div>
                </div>

            </div>

            <div className="p-6 border-t border-zinc-100 bg-zinc-50">
                <button 
                    onClick={handleSubmit}
                    disabled={!selectedPart || loading || form.quantity <= 0}
                    className="w-full bg-black text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-zinc-800 disabled:opacity-50 active:scale-95 transition-all"
                >
                    {loading ? "Updating..." : "Confirm & Add Stock"}
                </button>
            </div>

        </div>
    </div>
  );
}