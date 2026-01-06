"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminNavBar({ userEmail }: { userEmail: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
      {/* BRANDING */}
      <div className="flex items-center gap-2">
        <Link href="/admin/users" className="text-2xl font-black tracking-tighter text-gray-900">
          REVLET<span className="text-green-600">FLEET</span>
        </Link>
        {/* Purple Badge for Admins */}
        <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
          Admin
        </span>
      </div>

      {/* NAVIGATION LINKS */}
      <div className="hidden md:flex gap-6 text-sm font-bold text-gray-500">
        <Link href="/admin/users" className="hover:text-black transition-colors">
            Users
        </Link>
        
        <Link href="/admin" className="hover:text-black transition-colors">
            Techs
        </Link>
        
        <Link href="/admin/leads" className="hover:text-black transition-colors flex items-center gap-1">
            Leads <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">!</span>
        </Link>
        
        {/* NEW CUSTOMERS LINK */}
        <Link href="/admin/customers" className="hover:text-black transition-colors">
            Customers
        </Link>
      </div>

      {/* USER & SIGNOUT */}
      <div className="flex items-center gap-4">
        <div className="hidden md:block text-xs font-bold text-gray-400 uppercase tracking-wide">
          {userEmail}
        </div>
        <button 
          onClick={handleSignOut}
          className="text-sm font-bold text-gray-500 hover:text-red-600 hover:underline transition-all"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}