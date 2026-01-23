"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { format, parseISO } from "date-fns";
import { createBrowserClient } from "@supabase/ssr";

export default function LeadInboxClient({ 
    initialWebLeads, 
    initialFieldLeads 
}: { 
    initialWebLeads: any[], 
    initialFieldLeads: any[] 
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"FIELD" | "WEB">("FIELD");
  
  // State
  const [webLeads, setWebLeads] = useState(initialWebLeads);
  const [fieldLeads, setFieldLeads] = useState(initialFieldLeads);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- 🚀 THE CONVERSION ENGINE (Field Sales) ---
  const handleOnboard = async (lead: any) => {
    if (!confirm(`Are you sure you want to onboard ${lead.company_name}? This will create a Customer Account.`)) return;
    
    setProcessingId(lead.id);

    // 1. Create the Customer Record
    const { data: newCustomer, error: custError } = await supabase
      .from("customers")
      .insert({
        name: lead.company_name,
        address: lead.address,
        phone: lead.phone,
        contact_name: lead.contact_name,
        status: "ACTIVE", 
      })
      .select()
      .single();

    if (custError) {
      alert("Error creating customer: " + custError.message);
      setProcessingId(null);
      return;
    }

    // 2. Mark Lead as WON
    const { error: leadError } = await supabase
      .from("sales_leads")
      .update({ customer_status: "WON" })
      .eq("id", lead.id);

    if (leadError) {
      alert("Error updating lead status: " + leadError.message);
    } else {
      // 3. Remove from list & Celebrate
      alert(`🎉 ${lead.company_name} is now a Customer!`);
      setFieldLeads(current => current.filter(i => i.id !== lead.id));
      router.refresh();
    }
    setProcessingId(null);
  };

  // --- 🌐 WEB LEAD ACTIONS ---
  const updateWebStatus = async (id: string, newStatus: string) => {
    setWebLeads(current => current.map(l => l.id === id ? { ...l, status: newStatus } : l));
    await supabase.from("leads").update({ status: newStatus }).eq("id", id);
    router.refresh();
  };

  const deleteWebLead = async (id: string) => {
    if(!confirm("Delete this web lead permanently?")) return;
    setWebLeads(current => current.filter(l => l.id !== id));
    await supabase.from("leads").delete().eq("id", id);
    router.refresh();
  };

  return (
    <div className="p-8 min-h-screen bg-[#F4F5F7] text-zinc-900 font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">Lead Inbox</h1>
          <p className="text-zinc-500 font-medium mt-1">Manage Sales Reps & Web Inquiries.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-zinc-200 shadow-sm text-xs font-bold uppercase tracking-wider text-zinc-500">
            Total Pending: <span className="text-black ml-1">{webLeads.length + fieldLeads.length}</span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b border-zinc-200 mb-8">
         <button 
           onClick={() => setActiveTab('FIELD')}
           className={clsx("pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2", 
             activeTab === 'FIELD' ? "border-black text-black" : "border-transparent text-zinc-400 hover:text-zinc-600"
           )}
         >
            🚀 Field Sales (Reps)
            {fieldLeads.length > 0 && <span className="bg-black text-white px-1.5 py-0.5 rounded text-[10px]">{fieldLeads.length}</span>}
         </button>
         <button 
           onClick={() => setActiveTab('WEB')}
           className={clsx("pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2", 
             activeTab === 'WEB' ? "border-blue-600 text-blue-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
           )}
         >
            🌐 Web Inquiries
            {webLeads.length > 0 && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">{webLeads.length}</span>}
         </button>
      </div>

      {/* --- TAB CONTENT: FIELD SALES --- */}
      {activeTab === 'FIELD' && (
          <div className="space-y-4">
            {fieldLeads.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-zinc-300 text-center">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-lg font-bold text-zinc-900">All caught up!</h3>
                    <p className="text-zinc-500 text-sm">No pending field leads.</p>
                </div>
            ) : (
                fieldLeads.map((lead) => (
                    <div key={lead.id} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                           {/* INFO */}
                           <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold">{lead.company_name}</h3>
                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Field Lead</span>
                                    <span className="text-xs text-zinc-400">{lead.visit_date ? format(parseISO(lead.visit_date), 'MMM d, h:mm a') : 'Unknown Date'}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-zinc-600 mt-2">
                                    <div className="flex items-center gap-1"><span className="text-zinc-400">👤</span> {lead.contact_name}</div>
                                    <div className="flex items-center gap-1"><span className="text-zinc-400">📞</span> {lead.phone}</div>
                                    <div className="flex items-center gap-1"><span className="text-zinc-400">📍</span> {lead.address}</div>
                                </div>
                                {/* NOTES / TAGS */}
                                {lead.notes && (
                                    <div className="mt-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-sm text-zinc-600 whitespace-pre-wrap">
                                        <span className="font-bold text-zinc-400 text-xs mr-2 uppercase">Rep Notes:</span>
                                        {lead.notes}
                                    </div>
                                )}
                           </div>
                           
                           {/* ACTION */}
                           <div>
                                <button
                                  onClick={() => handleOnboard(lead)}
                                  disabled={processingId === lead.id}
                                  className="bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-black/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                                >
                                  {processingId === lead.id ? "Onboarding..." : "🚀 Onboard Now"}
                                </button>
                           </div>
                        </div>
                    </div>
                ))
            )}
          </div>
      )}

      {/* --- TAB CONTENT: WEB INQUIRIES --- */}
      {activeTab === 'WEB' && (
          <div className="space-y-4">
            {webLeads.length === 0 ? (
                 <div className="bg-white p-12 rounded-2xl border border-dashed border-zinc-300 text-center">
                     <div className="text-4xl mb-4">📭</div>
                     <h3 className="text-lg font-bold text-zinc-900">No web leads yet</h3>
                 </div>
            ) : (
                webLeads.map((lead) => (
                    <div key={lead.id} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white uppercase shadow-sm mt-1", 
                                lead.status === 'NEW' ? "bg-blue-600" : lead.status === 'CONTACTED' ? "bg-amber-500" : "bg-emerald-500"
                            )}>
                                {lead.full_name?.charAt(0) || "?"}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900">{lead.full_name}</h3>
                                <div className="text-sm font-medium text-zinc-500 mb-2">{lead.company_name} • {lead.email}</div>
                                <div className="flex gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                    <span className="bg-zinc-100 px-2 py-1 rounded">Fleet: {lead.fleet_size}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <select 
                                value={lead.status || "NEW"}
                                onChange={(e) => updateWebStatus(lead.id, e.target.value)}
                                className="appearance-none cursor-pointer pl-4 pr-8 py-2 rounded-lg text-xs font-black uppercase tracking-wider outline-none border transition-all bg-zinc-50 border-zinc-200"
                            >
                                <option value="NEW">New Lead</option>
                                <option value="CONTACTED">Contacted</option>
                                <option value="QUALIFIED">Qualified</option>
                                <option value="CLOSED">Closed (Won)</option>
                                <option value="LOST">Lost</option>
                            </select>
                            <button onClick={() => deleteWebLead(lead.id)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors">🗑️</button>
                        </div>
                    </div>
                ))
            )}
          </div>
      )}

    </div>
  );
}