"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { inviteCustomerUser } from "@/app/actions/invite-user"; 

export default function FleetDirectory() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviting, setInviting] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchCustomers = async () => {
        // Fetch ALL customers
        const { data } = await supabase
            .from("customers")
            .select("*")
            .order("created_at", { ascending: false });
        
        setCustomers(data || []);
        setLoading(false);
    };
    fetchCustomers();
  }, []);

  // Simple search filter
  const filtered = customers.filter(c => 
    (c.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (c.contact_name || "").toLowerCase().includes(search.toLowerCase())
  );

  // 📧 SMART INVITE LOGIC
  const handleInvite = async (customer: any) => {
      // 1. PRE-FILL THE EMAIL (Use what we have on file)
      const defaultEmail = customer.email || "";
      
      const email = prompt(
          `Enter email to invite ${customer.contact_name || "Admin"}:`, 
          defaultEmail // 👈 THIS PRE-FILLS THE BOX
      );
      
      if (!email) return;

      setInviting(customer.id);

      // 2. Send the Invite
      const result = await inviteCustomerUser(email, customer.contact_name);

      setInviting(null);

      if (result.success) {
          alert(`✅ Official Invite sent to ${email}!`);
      } else {
          // 3. HANDLE "ALREADY REGISTERED"
          if (result.error?.includes("already been registered")) {
              alert(`⚠️ Good news! ${email} is already in the system.\n\nGo to 'User Control' to see their status or reset their password.`);
          } else {
              alert("Error sending invite: " + result.error);
          }
      }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-zinc-900 font-sans p-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Fleet Directory</h1>
          <p className="text-zinc-500">Master database of all active accounts.</p>
        </div>
        <Link href="/admin/customers/new">
            <button className="bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-black/20 hover:scale-105 transition-transform flex items-center gap-2">
                <span>+</span> New Customer
            </button>
        </Link>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm mb-6 flex gap-4 items-center">
          <span className="text-xl">🔍</span>
          <input 
            className="w-full h-full outline-none text-sm font-medium placeholder:text-zinc-400" 
            placeholder="Search companies, contacts, or addresses..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
      </div>

      {/* CUSTOMER GRID */}
      {loading ? (
          <div className="text-zinc-400 p-12 text-center animate-pulse">Loading directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((cust) => (
                <div key={cust.id} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 group hover:shadow-md transition-all relative overflow-hidden">
                    
                    {/* 🏆 BADGE FOR SAM'S WINS */}
                    {cust.source === 'FIELD_SALES' && (
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black px-3 py-1.5 rounded-bl-xl uppercase tracking-widest shadow-sm z-10">
                            Field Sales Win
                        </div>
                    )}

                    <div className="flex items-start justify-between mb-4 mt-2">
                        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-xl font-bold text-zinc-700 uppercase">
                            {cust.name?.substring(0, 2) || "??"}
                        </div>
                        <button 
                            onClick={() => handleInvite(cust)}
                            disabled={inviting === cust.id}
                            className="text-xs font-bold bg-zinc-100 hover:bg-black hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                           {inviting === cust.id ? "Sending..." : "✉️ Invite User"}
                        </button>
                    </div>

                    <h3 className="text-lg font-bold mb-1 group-hover:text-blue-600 transition-colors">{cust.name}</h3>
                    
                    <div className="space-y-2 mt-4 text-sm text-zinc-600">
                        <div className="flex items-center gap-2">
                            <span className="w-5 text-center text-zinc-400">👤</span>
                            <span className="font-medium">{cust.contact_name || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-5 text-center text-zinc-400">📞</span>
                            <span>{cust.phone || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-5 text-center text-zinc-400">📧</span>
                            <span className="truncate max-w-[200px]">{cust.email || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-5 text-center text-zinc-400">📍</span>
                            <span className="truncate max-w-[200px]">{cust.address || "—"}</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${cust.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                             <span className="text-xs font-bold text-zinc-400 uppercase">{cust.status || "Unknown"}</span>
                        </div>
                        <button className="text-xs font-bold bg-white border border-zinc-200 text-zinc-600 px-4 py-2 rounded-lg hover:bg-zinc-50 transition">
                            View Fleet →
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}