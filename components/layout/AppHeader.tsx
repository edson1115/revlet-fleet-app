"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AppHeader() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [market, setMarket] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setEmail(user.email ?? null);
      setRole(user.user_metadata?.role ?? "UNKNOWN");

      // load market from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_market")
        .eq("id", user.id)
        .single();

      setMarket(profile?.active_market ?? "—");
    }

    load();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="w-full border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <div className="text-xl font-semibold tracking-tight">
            Revlet
          </div>

          {role && (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 border">
              {role}
            </span>
          )}

          {market && (
            <span className="text-xs px-2 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
              {market}
            </span>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4 text-sm">
          {email && (
            <span className="text-gray-600">
              {email}
            </span>
          )}

          <button
            onClick={signOut}
            className="px-3 py-1 rounded-md border hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
