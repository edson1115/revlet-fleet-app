"use client";

import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

const IconDashboard = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IconQueue = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const IconUsers = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m8-4a4 4 0 10-8 0 4 4 0 008 0z" /></svg>;
const IconAlert = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const IconLogout = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

export default function DispatchSidebar() {
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
          isActive ? "bg-black text-white shadow-lg scale-[1.02]" : "text-zinc-500 hover:bg-zinc-100 hover:text-black"
        )}
      >
        <Icon />
        {label}
      </button>
    );
  };

  return (
    <div className="w-72 bg-white border-r border-zinc-200 hidden md:flex flex-col sticky top-0 h-screen z-50">
      <div className="p-8 pb-6">
        <div className="bg-black text-white px-3 py-1 rounded text-xl font-black tracking-tighter italic inline-block shadow-xl">
          REVLET
        </div>
        <div className="mt-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
          Dispatch Console
        </div>
      </div>

      <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-black text-zinc-300 uppercase tracking-wider px-4 mb-2 mt-2">Menu</div>
        <NavItem label="Dashboard" icon={IconDashboard} path="/dispatch" exact={true} />
        {/* <NavItem label="Technicians" icon={IconUsers} path="/dispatch/technicians" /> */}
        {/* <NavItem label="Exceptions" icon={IconAlert} path="/dispatch/exceptions" /> */}
      </div>

      <div className="p-6 border-t border-zinc-100 bg-zinc-50/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 font-bold text-sm transition shadow-sm"
        >
          <IconLogout /> Sign Out
        </button>
      </div>
    </div>
  );
}