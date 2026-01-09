"use client";

import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { 
  Users, 
  Building2, 
  BarChart3, 
  Zap, 
  Settings, 
  LogOut,
  ClipboardList
} from "lucide-react";

// Find this section in AdminSidebar.tsx
const NAV_ITEMS = [
  { label: "Dashboard", icon: BarChart3, path: "/admin/dashboard" },
  { label: "User Control", icon: Users, path: "/admin/users" }, // 👈 FIXED: Use 'Users' component, not the string
  { label: "Customers", icon: Building2, path: "/admin/customers" },
  { label: "Lead Inbox", icon: Zap, path: "/admin/leads" },
  { label: "Techs", icon: ClipboardList, path: "/admin/techs" },
  { label: "System AI", icon: Settings, path: "/admin/ai" },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="w-64 bg-zinc-950 border-r border-white/5 flex flex-col h-screen sticky top-0 z-50">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="bg-white text-black px-2 py-1 rounded font-black italic tracking-tighter text-xl">R</div>
          <span className="text-white font-black tracking-tighter italic text-xl uppercase">Revlet<span className="text-zinc-500 text-sm align-top ml-1">Admin</span></span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[10px] transition-all uppercase tracking-[0.2em]",
                isActive 
                  ? "bg-white text-black shadow-lg" 
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-6 mt-auto border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition font-black text-[10px] uppercase tracking-widest"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );
}