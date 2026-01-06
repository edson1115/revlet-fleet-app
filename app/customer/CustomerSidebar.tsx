"use client";

import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

// --- ICONS ---
const IconDashboard = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IconCar = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const IconPlus = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const IconTire = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconLogout = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const IconList = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;

export default function CustomerSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
  }

  const NavItem = ({ label, icon: Icon, path, exact }: any) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);
    return (
        <button 
            onClick={() => router.push(path)}
            className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm mb-1",
                isActive ? "bg-black text-white shadow-lg scale-105" : "text-gray-500 hover:bg-gray-100 hover:text-black"
            )}
        >
            <Icon />
            {label}
        </button>
    );
  };

  return (
    <div className="w-72 bg-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen z-50">
          <div className="p-8 pb-6">
            <div className="bg-black text-white px-3 py-1 rounded text-xl font-black tracking-tighter italic inline-block shadow-xl">
                REVLET
            </div>
            <div className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Fleet Portal</div>
          </div>

          <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
             <div className="text-[10px] font-black text-gray-300 uppercase tracking-wider px-4 mb-2 mt-2">Menu</div>
             <NavItem label="Dashboard" icon={IconDashboard} path="/customer" exact={true} />
             <NavItem label="My Vehicles" icon={IconCar} path="/customer/vehicles" />
             <NavItem label="New Request" icon={IconPlus} path="/customer/requests/new" />
             <NavItem label="Service History" icon={IconList} path="/customer/requests" />
             <NavItem label="Tire Purchase" icon={IconTire} path="/customer/tires" />
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 font-bold text-sm transition shadow-sm">
                <IconLogout /> Sign Out
             </button>
          </div>
      </div>
  );
}