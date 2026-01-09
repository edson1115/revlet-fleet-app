"use client";

import { useState, useEffect } from "react";
import { getCustomers, addManualCustomer, updateCustomer, getMarketPerformance } from "@/app/actions/admin";
import clsx from "clsx";

type FilterMode = "ALL" | "ACTIVE" | "COLD";
const MARKETS = ["San Antonio", "Austin", "Houston", "Dallas"];

export default function CustomerDirectory() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [marketStats, setMarketStats] = useState<any[]>([]);
  const [selectedMarket, setSelectedMarket] = useState("San Antonio");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    const [custs, stats] = await Promise.all([getCustomers(), getMarketPerformance()]);
    setCustomers(custs);
    setMarketStats(stats);
    setLoading(false);
  };

  const filtered = customers.filter(c => {
    if (c.market !== selectedMarket) return false;
    const searchLower = search.toLowerCase();
    const companyMatch = (c.company_name || "").toLowerCase().includes(searchLower);
    const contactMatch = (c.contact_name || "").toLowerCase().includes(searchLower);
    if (!companyMatch && !contactMatch) return false;

    if (filter === "ALL") return true;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isCold = !c.last_service || new Date(c.last_service) < thirtyDaysAgo;

    if (filter === "COLD") return isCold;
    if (filter === "ACTIVE") return !isCold;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans">
      
      {/* 📊 MARKET PERFORMANCE BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {marketStats.length === 0 ? (
          <div className="col-span-full py-8 text-center bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200 text-zinc-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
            Analyzing Market Intelligence...
          </div>
        ) : (
          marketStats.map((stat) => (
            <div key={stat.name} onClick={() => setSelectedMarket(stat.name)} className={clsx(
              "p-6 rounded-[2rem] border transition-all shadow-sm cursor-pointer",
              selectedMarket === stat.name ? "bg-zinc-900 text-white border-zinc-800 scale-105" : "bg-white border-zinc-100 text-zinc-900"
            )}>
              <p className={clsx("text-[9px] font-black uppercase tracking-[0.2em] mb-1", selectedMarket === stat.name ? "text-zinc-500" : "text-zinc-400")}>{stat.name}</p>
              <p className="text-2xl font-black tracking-tighter">${stat.revenue.toLocaleString()}</p>
              <p className={clsx("text-[9px] font-bold mt-1 uppercase", selectedMarket === stat.name ? "text-emerald-400" : "text-zinc-500")}>{stat.jobs} Jobs</p>
            </div>
          ))
        )}
      </div>

      {/* COMMAND HEADER */}
      <div className="space-y-8 mb-12">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black text-zinc-900 tracking-tighter italic uppercase leading-none">Fleet Directory</h1>
              <p className="text-zinc-500 font-bold text-sm mt-2">Managing {selectedMarket} Intelligence.</p>
            </div>
            <button onClick={() => setShowModal(true)} className="bg-black text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-800 transition shadow-xl active:scale-95">
                + New Customer
            </button>
          </div>

          <div className="bg-white border border-zinc-200 p-2 rounded-3xl flex flex-wrap gap-2 shadow-sm">
            {MARKETS.map(m => (
                <button key={m} onClick={() => setSelectedMarket(m)} className={clsx("px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", selectedMarket === m ? "bg-zinc-900 text-white shadow-lg" : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900")}>
                    {m}
                </button>
            ))}
          </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex gap-2 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 w-full md:w-auto">
                {(["ALL", "ACTIVE", "COLD"] as FilterMode[]).map((m) => (
                  <button key={m} onClick={() => setFilter(m)} className={clsx("flex-1 md:flex-none px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", filter === m ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-zinc-600")}>
                    {m}
                  </button>
                ))}
          </div>
          <div className="relative w-full md:w-72">
            <input type="text" placeholder="Search accounts..." className="w-full px-12 py-3 bg-white border border-zinc-200 rounded-2xl outline-none font-bold text-xs" onChange={(e) => setSearch(e.target.value)} />
            <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
          </div>
      </div>

      {/* GRID */}
      {loading ? (
          <div className="py-20 text-center font-black uppercase italic text-zinc-300 tracking-[0.3em] animate-pulse">Syncing Fleet Data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(cust => {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const isCold = !cust.last_service || new Date(cust.last_service) < thirtyDaysAgo;

                return (
                  <div key={cust.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 hover:border-zinc-900 transition-all group relative flex flex-col h-full">
                      
                      {/* Fleet Brain Risk Badge */}
                      <div className="absolute -top-3 -right-3 z-10">
                        <div className={clsx(
                          "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl border",
                          isCold ? "bg-red-600 text-white border-red-500 animate-pulse" : "bg-emerald-500 text-white border-emerald-400"
                        )}>
                          {isCold ? "HIGH RISK" : "STABLE"}
                        </div>
                      </div>

                      <div className={clsx("absolute top-0 left-0 w-full h-1.5 rounded-t-full", isCold ? "bg-orange-400" : "bg-emerald-400")} />

                      <div className="flex justify-between items-start mb-6">
                        <div className={clsx("text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest", isCold ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600")}>
                            {isCold ? "❄️ Cold Account" : "⚡ Active Fleet"}
                        </div>
                        <button onClick={() => setEditingCustomer(cust)} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-black font-black text-[10px] uppercase">Edit</button>
                      </div>
                      
                      <h3 className="text-2xl font-black text-zinc-900 mb-1 leading-none tracking-tighter uppercase italic">{cust.company_name}</h3>
                      <p className="text-[10px] font-black text-zinc-400 mb-6 uppercase tracking-[0.2em]">{cust.contact_name || "No Contact"}</p>
                      
                      {/* Fleet Brain Insight */}
                      <div className="mb-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">🧠 Insight</span>
                        <p className="text-[11px] font-bold text-zinc-800 leading-tight mt-1">
                          {isCold ? "Churn risk detected. No activity in 30 days." : "Maintenance compliance is optimal."}
                        </p>
                      </div>

                      <div className="space-y-2 text-xs mb-8 flex-grow">
                          <div className="flex items-center gap-3 font-bold text-zinc-600">📞 {cust.phone || "---"}</div>
                          <div className="flex items-center gap-3 font-bold text-zinc-600">📧 {cust.email || "---"}</div>
                      </div>

                      <div className="pt-6 border-t border-zinc-50 mb-8">
                          <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-3">Audit Trail</p>
                          {cust.last_service ? (
                            <div className="flex items-center gap-4">
                              <p className="font-black text-xs text-zinc-900">{new Date(cust.last_service).toLocaleDateString()}</p>
                              <div className="bg-zinc-100 text-zinc-500 text-[8px] font-black px-2 py-1 rounded uppercase border border-zinc-200">
                                {cust.last_service_title}
                              </div>
                            </div>
                          ) : (
                            <p className="font-black text-[10px] text-zinc-300 italic">No Service Data</p>
                          )}
                      </div>

                      <button onClick={() => alert(`Creating Job for ${cust.company_name}`)} className="w-full bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl hover:bg-black transition-all shadow-xl">
                          Dispatch Service
                      </button>
                  </div>
                );
            })}
        </div>
      )}

      {/* MODALS */}
      {(showModal || editingCustomer) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black mb-6 italic tracking-tighter uppercase">
              {editingCustomer ? "Edit Fleet" : "Manual Onboarding"}
            </h2>
            <form action={async (formData) => {
              const res = editingCustomer ? await updateCustomer(formData) : await addManualCustomer(formData);
              if (res?.error) alert(res.error);
              else { setShowModal(false); setEditingCustomer(null); await refreshData(); }
            }}>
              {editingCustomer && <input type="hidden" name="id" value={editingCustomer.id} />}
              <div className="space-y-4">
                <input name="company" defaultValue={editingCustomer?.company_name} required className="w-full p-4 bg-zinc-50 rounded-2xl border border-zinc-100 font-bold text-sm" placeholder="Company Name" />
                <select name="market" defaultValue={editingCustomer?.market || selectedMarket} className="w-full p-4 bg-zinc-50 rounded-2xl border border-zinc-100 font-bold text-sm">
                  {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input name="contact" defaultValue={editingCustomer?.contact_name} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-sm font-bold" placeholder="Contact" />
                  <input name="phone" defaultValue={editingCustomer?.phone} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-sm font-bold" placeholder="Phone" />
                </div>
                <input name="email" defaultValue={editingCustomer?.email} className="w-full p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-sm font-bold" placeholder="Email" />
                <textarea name={editingCustomer ? "billingAddress" : "address"} defaultValue={editingCustomer?.billing_address} className="w-full p-4 bg-zinc-50 rounded-2xl border border-zinc-100 h-24 resize-none text-sm font-bold" placeholder="Address..." />
              </div>
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => { setShowModal(false); setEditingCustomer(null); }} className="flex-1 py-4 font-black text-zinc-400 uppercase tracking-widest text-[10px]">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-black text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}