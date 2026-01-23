"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize client manually for public insertion
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LeadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const { error } = await supabase.from("leads").insert({
      full_name: formData.get("fullName"),
      email: formData.get("email"),
      company_name: formData.get("companyName"),
      fleet_size: formData.get("fleetSize"),
    });

    setLoading(false);

    if (error) {
      alert("Something went wrong. Please try again.");
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Decor: Ambient Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[50px] pointer-events-none" />

        {success ? (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Request Received</h3>
                <p className="text-zinc-400 mb-6">We'll be in touch shortly to schedule your demo.</p>
                <button onClick={onClose} className="bg-white text-black font-bold py-3 px-8 rounded-xl hover:bg-zinc-200 transition">
                    Close
                </button>
            </div>
        ) : (
            <>
                <div className="mb-6 relative z-10">
                    <h2 className="text-2xl font-black text-white tracking-tight">Schedule a Demo</h2>
                    <p className="text-sm text-zinc-400 mt-1">See how Revlet can optimize your fleet operations.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Name</label>
                        <input name="fullName" required className="w-full bg-black/50 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" placeholder="Jane Doe" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Work Email</label>
                        <input name="email" type="email" required className="w-full bg-black/50 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" placeholder="jane@company.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Company</label>
                            <input name="companyName" required className="w-full bg-black/50 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition" placeholder="Acme Logistics" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Fleet Size</label>
                            <select name="fleetSize" className="w-full bg-black/50 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition appearance-none">
                                <option value="1-10">1-10 Vehicles</option>
                                <option value="11-50">11-50 Vehicles</option>
                                <option value="50+">50+ Vehicles</option>
                            </select>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl mt-2 transition-all shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Sending..." : "Request Access"}
                    </button>
                </form>

                <button onClick={onClose} className="absolute top-0 right-0 p-2 text-zinc-500 hover:text-white transition">
                    ✕
                </button>
            </>
        )}
      </div>
    </div>
  );
}