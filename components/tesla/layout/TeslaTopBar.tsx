"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; // ✅ Import Image

type Me = {
  role?: string;
  market?: string;
  email?: string;
  customer_name?: string;
};

export default function TeslaTopBar() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const js = await res.json();
        if (js.ok) setMe(js.user);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!me) return <div className="h-16 border-b bg-white" />;

  return (
    <div className="h-16 border-b border-gray-100 bg-white flex items-center justify-between px-6 shrink-0 z-20 relative">

      {/* LEFT: BRANDING + ACCOUNT */}
      <div className="flex items-center gap-6">
        {/* LOGO */}
        <div className="flex items-center">
            {/* Make sure revlet-logo.png is in your /public folder */}
            <img 
                src="/revlet-logo.png" 
                alt="Revlet" 
                className="h-8 w-auto object-contain" 
            />
        </div>

        <div className="h-8 w-[1px] bg-gray-200 hidden sm:block"></div>

        {/* CUSTOMER ACCOUNT NAME */}
        <div className="hidden sm:block">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Account
            </div>
            <div className="font-bold text-gray-900 leading-none text-lg">
                {me.customer_name || "Loading..."}
            </div>
        </div>
      </div>

      {/* RIGHT: USER INFO & SIGNOUT */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
            <div className="text-sm font-medium text-black">
                {me.email}
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                {me.role ?? "USER"} • {me.market ?? "USA"}
            </div>
        </div>

        <button
          onClick={signOut}
          className="text-xs font-bold bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}