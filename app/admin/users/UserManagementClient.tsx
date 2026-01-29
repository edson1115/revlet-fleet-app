"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { format, parseISO } from "date-fns";
import { inviteCustomerUser } from "@/app/actions/invite-user"; 
import { createBrowserClient } from "@supabase/ssr";

// 🎨 ROLE CONFIGURATION
const ROLES = [
  { value: "ALL", label: "All Users" },
  { value: "SUPERADMIN", label: "👑 Super Admin", color: "bg-purple-50 text-purple-700 border-purple-100" },
  { value: "ADMIN", label: "🧠 Admin", color: "bg-blue-50 text-blue-700 border-blue-100" },
  { value: "OFFICE", label: "💻 Office", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  { value: "DISPATCHER", label: "🚚 Dispatcher", color: "bg-orange-50 text-orange-700 border-orange-100" },
  { value: "SALES", label: "💼 Sales Rep", color: "bg-pink-50 text-pink-700 border-pink-100" },
  { value: "TECHNICIAN", label: "🔧 Technician", color: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  { value: "CUSTOMER", label: "👤 Customer", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
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
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // State
  const [isInviting, setIsInviting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PENDING'>('ACTIVE');
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // --- PERMISSION EDITING STATE ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPermissions, setTempPermissions] = useState<any>({});

  // --- FILTER LOGIC ---
  const pendingUsers = users.filter(u => !u.last_sign_in_at);
  const activeUsers = users.filter(u => !!u.last_sign_in_at);
  
  const displayList = (activeTab === 'PENDING' ? pendingUsers : activeUsers).filter(u => {
    const matchesRole = currentRole === "ALL" || u.role === currentRole;
    const matchesSearch = 
      (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
      (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.company_name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // --- ACTIONS ---
  const handleSync = async () => {
    setIsSyncing(true);
    router.refresh(); 
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSyncing(false);
  };

  async function handleDelete(userId: string) {
      if(!confirm("Are you sure? This effectively bans the user.")) return;
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("Failed to delete user.");
  }

  async function handleRoleUpdate(userId: string, newRole: string) {
      const res = await fetch(`/api/admin/users`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole })
      });
      if (res.ok) router.refresh();
      else alert("Failed to update role.");
  }

  // --- PERMISSION HANDLERS ---
  const handleEditPermissions = (user: any) => {
    setEditingId(user.id);
    setTempPermissions(user.permissions || {});
  };

  const togglePermission = (key: string) => {
    setTempPermissions((prev: any) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSavePermissions = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ permissions: tempPermissions })
      .eq("id", userId);

    if (error) {
      alert("Error saving permissions");
    } else {
      setEditingId(null);
      router.refresh();
    }
  };

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setIsInviting(true);
    setMessage(null);

    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const fullName = formData.get("fullName") as string;

    const result = await inviteCustomerUser(email, fullName);
    
    setIsInviting(false);
    
    if (result.success) {
        setMessage({ text: `Invitation sent to ${email}!`, type: 'success' });
        form.reset();
        router.refresh();
    } else {
        setMessage({ text: `Error: ${result.error}`, type: 'error' });
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] p-8 font-sans text-zinc-900">
      
      {/* --- COMMAND HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 bg-zinc-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white">User Control</h1>
            <p className="text-zinc-400 text-sm mt-2 font-medium">Manage credentials, access, and security.</p>
        </div>
        <div className="flex gap-3 relative z-10 mt-6 md:mt-0">
           <button 
             onClick={handleSync} 
             disabled={isSyncing}
             className="bg-white text-zinc-900 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition flex items-center gap-2 shadow-lg"
           >
             {isSyncing ? "Syncing..." : "Sync Users"} 🔄
           </button>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="flex gap-8 border-b border-zinc-200 mb-8 px-2">
         <button onClick={() => setActiveTab('ACTIVE')} className={clsx("pb-4 text-xs font-black uppercase tracking-widest border-b-[3px] transition flex items-center gap-2", activeTab === 'ACTIVE' ? "border-emerald-500 text-black" : "border-transparent text-zinc-400 hover:text-zinc-600")}>
            Active Users <span className={clsx("px-1.5 py-0.5 rounded text-[9px]", activeTab === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500")}>{activeUsers.length}</span>
         </button>
         <button onClick={() => setActiveTab('PENDING')} className={clsx("pb-4 text-xs font-black uppercase tracking-widest border-b-[3px] transition flex items-center gap-2", activeTab === 'PENDING' ? "border-amber-500 text-black" : "border-transparent text-zinc-400 hover:text-zinc-600")}>
            Pending Invites {pendingUsers.length > 0 && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px]">{pendingUsers.length}</span>}
         </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* --- LEFT: USER LIST --- */}
        <div className="flex-1 space-y-6">
            <div className="flex gap-3 mb-2">
                <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">🔍</span>
                    <input 
                        placeholder="Search users or companies..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-black shadow-sm"
                    />
                </div>
                <select 
                    value={currentRole}
                    onChange={(e) => router.push(`?role=${e.target.value}`)}
                    className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer shadow-sm uppercase tracking-wide text-zinc-600"
                >
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label.replace(/[^a-zA-Z ]/g, "")}</option>)}
                </select>
            </div>

            <div className="bg-white border border-zinc-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[400px]">
                {displayList.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center h-full">
                        <div className="text-4xl mb-4 text-zinc-200">📭</div>
                        <div className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No users found</div>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">
                        {displayList.map(user => {
                             const roleConfig = ROLES.find(r => r.value === user.role) || ROLES[7];
                             const linkedCompany = customers.find(c => c.id === user.customer_id)?.company_name || user.company_name;
                             const isEditing = editingId === user.id;

                             return (
                                <div key={user.id} className={clsx("p-6 hover:bg-zinc-50 transition group flex flex-col sm:flex-row sm:items-center justify-between gap-6", isEditing && "bg-blue-50/30")}>
                                    <div className="flex gap-5 items-center flex-1">
                                        <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white uppercase shadow-sm flex-shrink-0", activeTab === 'PENDING' ? "bg-amber-400" : "bg-black")}>
                                            {user.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 flex-wrap mb-1">
                                                <h3 className="text-base font-bold text-zinc-900">{user.name}</h3>
                                                {linkedCompany && <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 uppercase tracking-wider">{linkedCompany}</span>}
                                            </div>
                                            <p className="text-xs text-zinc-400 font-bold tracking-wide">{user.email}</p>
                                            
                                            {/* --- PERMISSIONS BADGES (READ ONLY) --- */}
                                            {!isEditing && activeTab === 'ACTIVE' && (
                                              <div className="flex flex-wrap gap-2 mt-2">
                                                {user.last_sign_in_at && (
                                                  <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    {format(parseISO(user.last_sign_in_at), 'MMM d')}
                                                  </span>
                                                )}
                                                {user.permissions?.access_dispatch && <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-bold uppercase">Dispatch</span>}
                                                {user.permissions?.access_tech_app && <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-bold uppercase">Tech App</span>}
                                                {user.permissions?.access_admin && <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-bold uppercase">Admin</span>}
                                              </div>
                                            )}

                                            {/* --- PERMISSIONS EDITOR (EDIT MODE) --- */}
                                            {isEditing && (
                                              <div className="flex gap-3 mt-3 animate-in fade-in slide-in-from-left-2">
                                                 <label className="flex items-center gap-1.5 cursor-pointer bg-white border border-zinc-200 px-2 py-1 rounded-md shadow-sm">
                                                    <input type="checkbox" checked={tempPermissions.access_dispatch || false} onChange={() => togglePermission('access_dispatch')} className="text-indigo-600 focus:ring-indigo-500 rounded" />
                                                    <span className="text-[10px] font-bold uppercase text-zinc-600">Dispatch</span>
                                                 </label>
                                                 <label className="flex items-center gap-1.5 cursor-pointer bg-white border border-zinc-200 px-2 py-1 rounded-md shadow-sm">
                                                    <input type="checkbox" checked={tempPermissions.access_tech_app || false} onChange={() => togglePermission('access_tech_app')} className="text-green-600 focus:ring-green-500 rounded" />
                                                    <span className="text-[10px] font-bold uppercase text-zinc-600">Tech App</span>
                                                 </label>
                                                 <label className="flex items-center gap-1.5 cursor-pointer bg-white border border-zinc-200 px-2 py-1 rounded-md shadow-sm">
                                                    <input type="checkbox" checked={tempPermissions.access_admin || false} onChange={() => togglePermission('access_admin')} className="text-purple-600 focus:ring-purple-500 rounded" />
                                                    <span className="text-[10px] font-bold uppercase text-zinc-600">Admin</span>
                                                 </label>
                                              </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="flex items-center gap-3 self-end sm:self-auto">
                                        {activeTab === 'PENDING' ? (
                                             <>
                                                 <button onClick={() => handleDelete(user.id)} className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition">Revoke</button>
                                                 <button onClick={() => alert(`Resend invite to ${user.email} (Feature coming soon)`)} className="px-4 py-2 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-200 shadow-sm transition">Resend</button>
                                             </>
                                        ) : (
                                             <>
                                                 {isEditing ? (
                                                    <div className="flex items-center gap-2">
                                                       <button onClick={() => setEditingId(null)} className="text-xs font-bold text-zinc-400 hover:text-zinc-600 px-2">Cancel</button>
                                                       <button onClick={() => handleSavePermissions(user.id)} className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-zinc-800 shadow-lg shadow-zinc-200">Save</button>
                                                    </div>
                                                 ) : (
                                                    <div className="flex items-center gap-3">
                                                       <select 
                                                          value={user.role} 
                                                          onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                                          className={clsx("px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none border transition appearance-none text-center", roleConfig.color)}
                                                       >
                                                          {ROLES.filter(r => r.value !== "ALL").map(r => (
                                                             <option key={r.value} value={r.value}>{r.label.replace(/[^a-zA-Z ]/g, "")}</option>
                                                          ))}
                                                       </select>
                                                       
                                                       <button onClick={() => handleEditPermissions(user)} className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline whitespace-nowrap">
                                                          Edit Access
                                                       </button>

                                                       <button onClick={() => handleDelete(user.id)} className="text-[10px] font-bold text-zinc-300 hover:text-red-600 transition px-2">🗑️</button>
                                                    </div>
                                                 )}
                                             </>
                                        )}
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                )}
            </div>
        </div>

        {/* --- RIGHT: INVITE FORM (STICKY) --- */}
        <div className="w-full lg:w-96">
            <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-xl sticky top-6">
                <div className="mb-6">
                    <h3 className="text-lg font-black text-zinc-900 uppercase italic tracking-tighter">Quick Invite</h3>
                    <p className="text-zinc-400 text-xs font-medium mt-1">Send a magic link to a new user.</p>
                </div>

                {message && (
                    <div className={clsx("p-4 rounded-xl text-xs font-bold mb-6 flex items-center gap-2", message.type === 'error' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
                        <span>{message.type === 'error' ? '⚠️' : '✅'}</span>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleInvite} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 mb-1 block">Full Name</label>
                        <input name="fullName" required placeholder="Ex. Elon Musk" className="w-full p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-sm font-bold outline-none focus:bg-white focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100 transition placeholder:text-zinc-300" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 mb-1 block">Email Address</label>
                        <input name="email" type="email" required placeholder="Ex. elon@spacex.com" className="w-full p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-sm font-bold outline-none focus:bg-white focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100 transition placeholder:text-zinc-300" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 mb-1 block">Assign Role</label>
                        <div className="relative">
                            <select name="role" className="w-full p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-sm font-bold outline-none cursor-pointer appearance-none">
                                <option value="CUSTOMER">👤 Customer (Default)</option>
                                {ROLES.filter(r => r.value !== "ALL" && r.value !== "CUSTOMER").map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">▼</span>
                        </div>
                    </div>
                    <button type="submit" disabled={isInviting} className="w-full py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-200 mt-4">
                        {isInviting ? "Sending..." : "Send Magic Link ⚡"}
                    </button>
                </form>
            </div>
        </div>

      </div>
    </div>
  );
}