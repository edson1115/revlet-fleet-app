"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  
  // Form State
  const [address, setAddress] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 🏷️ Quick Tags (Reps tap these instead of typing)
  const TAGS = ["Fleet 50+", "High Interest", "Service Needed", "Competitor: Goodyear", "Follow Up ASAP", "Manager Not In"];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // 📍 Mock "Use Current Location"
  const handleGeoLocate = () => {
    setLocating(true);
    // Simulate API delay - In real life, use navigator.geolocation
    setTimeout(() => {
        setAddress("1200 Broadway St, San Antonio, TX 78215");
        setLocating(false);
    }, 1200);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    // Combine manual notes with selected tags for the database
    const manualNotes = formData.get("notes") as string;
    const finalNotes = `[TAGS: ${selectedTags.join(", ")}] \n\n ${manualNotes}`;

    const { error } = await supabase.from("sales_leads").insert({
        sales_rep_id: user.id,
        company_name: formData.get("company_name"),
        contact_name: formData.get("contact_name"),
        phone: formData.get("phone"),
        address: address, // Uses the state (auto-detected or typed)
        notes: finalNotes,
        customer_status: "ONBOARDING",
        visit_date: new Date().toISOString()
    });

    if (error) {
        alert("Error: " + error.message);
        setLoading(false);
    } else {
        router.push("/sales");
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6 font-sans">
       
       {/* HEADER */}
       <div className="flex items-center gap-4 mb-8 pt-2">
         <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition active:scale-95">
            ←
         </button>
         <div>
             <h1 className="text-xl font-bold tracking-tight">New Drop-In</h1>
             <p className="text-xs text-slate-400">Log a new shop visit</p>
         </div>
       </div>

       <form onSubmit={handleSubmit} className="space-y-8 max-w-lg mx-auto">
           
           {/* SECTION 1: WHO */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">The Prospect</span>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4 backdrop-blur-md">
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Company Name</label>
                     <input name="company_name" required className="w-full bg-black/20 border border-white/5 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition" placeholder="e.g. Joe's Plumbing" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                         <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Contact Name</label>
                         <input name="contact_name" required className="w-full bg-black/20 border border-white/5 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition" placeholder="Manager Name" />
                      </div>
                      <div>
                         <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Phone</label>
                         <input name="phone" type="tel" className="w-full bg-black/20 border border-white/5 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition" placeholder="(555) 000-0000" />
                      </div>
                  </div>
              </div>
           </div>

           {/* SECTION 2: WHERE */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Location</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-1 backdrop-blur-md flex items-center">
                  <input 
                      name="address" 
                      required 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-transparent border-none p-4 text-white placeholder:text-slate-600 focus:ring-0" 
                      placeholder="Enter address manually..." 
                  />
                  <button 
                    type="button" 
                    onClick={handleGeoLocate}
                    className="mr-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition active:scale-95 whitespace-nowrap"
                  >
                    {locating ? (
                        <span className="animate-pulse">Locating...</span>
                    ) : (
                        <><span>📍</span> Auto-Detect</>
                    )}
                  </button>
              </div>
           </div>

           {/* SECTION 3: CONTEXT */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Intelligence</span>
              </div>

              {/* Quick Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                  {TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                            selectedTags.includes(tag) 
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50" 
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {tag}
                      </button>
                  ))}
              </div>

              <textarea 
                  name="notes" 
                  rows={3} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition" 
                  placeholder="Additional notes... (e.g. Gate code is 1234)" 
              />
           </div>

           {/* SUBMIT */}
           <div className="pt-4 pb-12">
               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                 {loading ? "Syncing..." : "Log Visit & Finish"}
                 {!loading && <span>→</span>}
               </button>
           </div>

       </form>
    </div>
  );
}