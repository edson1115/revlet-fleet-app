"use client";

import { useState } from "react";
import { inviteUser, deleteUser, repairFleetLinks } from "@/app/actions/admin";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";

const ROLES = [
  { value: "ALL", label: "🌍 All Positions", color: "bg-zinc-100 text-zinc-800" },
  { value: "SUPERADMIN", label: "👑 Super Admin", color: "bg-purple-100 text-purple-800" },
  { value: "ADMIN", label: "🧠 Admin", color: "bg-blue-100 text-blue-800" },
  { value: "OFFICE", label: "💻 Office", color: "bg-indigo-100 text-indigo-800" },
  { value: "DISPATCHER", label: "🚚 Dispatcher", color: "bg-orange-100 text-orange-800" },
  { value: "TECHNICIAN", label: "🔧 Technician", color: "bg-gray-100 text-gray-800" },
  { value: "CUSTOMER", label: "👤 Customer", color: "bg-emerald-100 text-emerald-800" },
];

const STATES = [
  { code: "TX", name: "Texas", markets: ["San Antonio", "Austin", "Houston", "Dallas"] },
  { code: "CA", name: "California", markets: ["San Francisco", "Los Angeles", "Sacramento"] }
];

export default function UserManagementClient({ 
  users, 
  customers,
  currentMarket,
  currentRole
}: { 
  users: any[], 
  customers: any[],
  currentMarket: string,
  currentRole: string
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isInviting, setIsInviting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedRole, setSelectedRole] = useState("CUSTOMER");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`);
  };

  async function handleInvite(formData: FormData) {
    setIsInviting(true);
    setMessage(null);
    const res = await inviteUser(formData);
    setIsInviting(false);
    if (res.error) {
        setMessage({ text: res.error, type: 'error' });
    } else {
        setMessage({ text: "Invitation sent! Check email.", type: 'success' });
        setTimeout(() => window.location.reload(), 1500);
    }
  }

  async function handleDelete(userId: string) {
      if(!confirm("Are you sure? Access removal is logged for audit.")) return;
      const formData = new FormData();
      formData.append("userId", userId);
      await deleteUser(formData);
      window.location.reload();
  }

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-8 font-sans selection:bg-black selection:text-white">
      {/* --- COMMAND HEADER --- */}
      <div className="flex justify-between items-center mb-12 bg-zinc-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white">Control Center</h1>
            <p className="text-zinc-400 text-sm mt-2 font-medium">Drill-down fleet management for {currentMarket}.</p>
        </div>
        <div className="flex gap-3 relative z-10">
            <button onClick={() => repairFleetLinks()} disabled={isSyncing} className="bg-amber-500 hover:bg-amber-600 text-black px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center gap-2">
              ⚡ Sync Fleet
            </button>
            <button onClick={() => window.location.href = '/admin/dashboard'} className="bg-white text-black px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition">Analytics</button>
        </div>
      </div>

      {/* --- DRILL-DOWN NAVIGATION --- */}
      <div className="bg-black border border-zinc-800 p-6 rounded-[2.5rem] mb-12 space-y-6 shadow-xl">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] whitespace-nowrap">Market:</span>
          {STATES[0].markets.map(m => (
            <button key={m} onClick={() => updateFilter('market', m)}
              className={clsx("px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                currentMarket === m ? "bg-white text-black scale-105" : "bg-zinc-900 text-zinc-500 hover:text-white")}>
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] whitespace-nowrap">Position:</span>
          {ROLES.map(r => (
            <button key={r.value} onClick={() => updateFilter('role', r.value)}
              className={clsx("px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                currentRole === r.value ? "border-2 border-white text-white" : "border border-zinc-800 text-zinc-500 hover:border-zinc-600")}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-200 sticky top-8">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-gray-900">
                <div className="w-2 h-6 bg-blue-500 rounded-full"></div> Invite User
            </h2>
            <form action={handleInvite} className="space-y-4">
              <input name="fullName" required placeholder="Full Name" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 outline-none transition font-medium text-gray-900" />
              <input name="email" type="email" required placeholder="Email Address" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 outline-none transition font-medium text-gray-900" />
              <select name="role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 font-bold outline-none cursor-pointer">
                {ROLES.filter(r => r.value !== "ALL").map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              {selectedRole === "CUSTOMER" && (
                <select name="customerId" required className="w-full p-4 bg-blue-50 border border-blue-100 text-blue-900 rounded-2xl font-bold outline-none">
                  <option value="">Link Company...</option>
                  {customers.map((c) => (<option key={c.id} value={c.id}>{c.company_name}</option>))}
                </select>
              )}
              <button type="submit" disabled={isInviting} className="w-full py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-zinc-800 transition shadow-xl">
                {isInviting ? "Working..." : "Send Invitation"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="relative group">
            <input type="text" placeholder={`Search ${currentMarket} users...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-6 bg-white rounded-[2rem] border border-gray-200 shadow-sm outline-none transition font-bold text-gray-900 pl-14" />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl group-focus-within:scale-110 transition">🔍</span>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                    const roleConfig = ROLES.find(r => r.value === user.role) || ROLES[6];
                    const linkedCompany = customers.find(c => c.id === user.customer_id)?.company_name;

                    return (
                        <tr key={user.id} className="hover:bg-gray-50 transition group">
                            <td className="p-6">
                                <div className="font-black text-gray-900 text-lg leading-none">{user.full_name || "New User"}</div>
                                <div className="text-sm text-gray-400 mt-1 font-medium">{user.email}</div>
                            </td>
                            <td className="p-6">
                                <div className="flex flex-col gap-1">
                                    <span className={clsx("w-fit px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider", roleConfig.color)}>
                                        {roleConfig.label}
                                    </span>
                                    {linkedCompany && <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest pl-1">🏢 {linkedCompany}</span>}
                                </div>
                            </td>
                            <td className="p-6 text-right">
                                <div className="flex flex-col items-end gap-1">
                                    <button onClick={() => handleDelete(user.id)} className="text-gray-300 font-bold text-[10px] uppercase tracking-widest hover:text-red-600 transition opacity-0 group-hover:opacity-100">
                                        Remove Access
                                    </button>
                                    <span className="text-[8px] text-zinc-400 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-delay-75">
                                        Log: Auto-Audit Active
                                    </span>
                                </div>
                            </td>
                        </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}