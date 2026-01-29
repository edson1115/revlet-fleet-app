"use client";

import { useState } from "react";
import { grantManualXp } from "@/app/actions/gamification";

export default function GrantXpModal({ 
  onClose, 
  players 
}: { 
  onClose: () => void;
  players: any[];
}) {
  const [selectedTech, setSelectedTech] = useState(players[0]?.id || "");
  const [amount, setAmount] = useState(50);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason) return alert("Please provide a reason.");
    setIsSubmitting(true);
    
    const result = await grantManualXp(selectedTech, amount, reason);
    
    setIsSubmitting(false);
    if (result.error) {
        alert(result.error);
    } else {
        onClose(); // Close modal on success
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-1">Grant Bonus XP</h2>
        <p className="text-xs text-zinc-500 mb-6">Reward exceptional behavior or correct mistakes.</p>

        <div className="space-y-4">
            {/* Tech Selector */}
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Recipient</label>
                <select 
                    className="w-full p-3 bg-zinc-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-black"
                    value={selectedTech}
                    onChange={(e) => setSelectedTech(e.target.value)}
                >
                    {players.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                    ))}
                </select>
            </div>

            {/* Amount Selector */}
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Amount</label>
                <div className="grid grid-cols-4 gap-2">
                    {[10, 50, 100, 500].map((val) => (
                        <button 
                            key={val}
                            onClick={() => setAmount(val)}
                            className={`py-2 rounded-lg text-xs font-black transition ${amount === val ? "bg-amber-400 text-black shadow-md" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"}`}
                        >
                            +{val}
                        </button>
                    ))}
                </div>
                {/* Manual Input Override */}
                <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="mt-2 w-full p-2 text-center border-b border-zinc-200 font-mono text-lg font-bold outline-none focus:border-black"
                />
            </div>

            {/* Reason */}
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Reason</label>
                <input 
                    type="text" 
                    placeholder="e.g. Cleanest Van, Great Customer Review..."
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-sm outline-none focus:border-black transition"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
            </div>

            <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition mt-4"
            >
                {isSubmitting ? "Awarding..." : "Award XP"}
            </button>
            
            <button onClick={onClose} className="w-full text-center text-xs font-bold text-zinc-400 py-2 hover:text-black">Cancel</button>
        </div>
      </div>
    </div>
  );
}