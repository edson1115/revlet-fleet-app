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

  
}