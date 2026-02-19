"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function LogoutPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const performLogout = async () => {
      await supabase.auth.signOut();
      router.refresh();
      router.push("/login");
    };

    performLogout();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-400">Logging out...</p>
      </div>
    </div>
  );
}