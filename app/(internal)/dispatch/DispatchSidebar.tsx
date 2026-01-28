"use client";

import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

// Icons
const IconDashboard = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IconLogout = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

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
        title={label} // Tooltip since text is hidden
        className={clsx(
          "w-full flex justify-center items-center p-4 rounded-xl transition-all mb-2",
          isActive ? "bg-black text-white shadow-lg" : "text-zinc-400 hover:bg-zinc-100 hover:text-black"
        )}
      >
        <Icon />
      </button>
    );
  };

  return (
    // ✅ Changed w-72 to w-20 (Slim Sidebar)
    <div className="w-20 bg-white border-r border-zinc-200 hidden md:flex flex-col sticky top-0 h-screen z-50 items-center py-6">
      
      {/* Logo (R Icon) */}
      <div className="mb-8">
        <div className="bg-black text-white w-10 h-10 flex items-center justify-center rounded-lg text-lg font-black tracking-tighter italic shadow-xl cursor-default">
          R
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 w-full px-2 space-y-2">
        <NavItem label="Dashboard" icon={IconDashboard} path="/dispatch" exact={true} />
        {/* Add more icons here later */}
      </div>

      {/* Logout */}
      <div className="mt-auto w-full px-2">
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="w-full flex justify-center items-center p-3 rounded-xl border border-transparent text-zinc-400 hover:text-red-600 hover:bg-red-50 transition"
        >
          <IconLogout />
        </button>
      </div>
    </div>
  );
}