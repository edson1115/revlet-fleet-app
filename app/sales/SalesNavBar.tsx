"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SalesNavBar({ userEmail }: { userEmail: string }) {
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
        <Link href="/sales" className="text-2xl font-black tracking-tighter text-gray-900">
          REVLET<span className="text-green-600">FLEET</span>
        </Link>
        <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
          Sales
        </span>
      </div>

      {/* USER & SIGNOUT */}
      <div className="flex items-center gap-4">
        <div className="hidden md:block text-xs font-bold text-gray-400 uppercase tracking-wide">
          {userEmail}
        </div>
        <button 
          onClick={handleSignOut}
          className="text-sm font-bold text-gray-500 hover:text-black hover:underline transition-all"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}