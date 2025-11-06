// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  useEffect(() => {
    (async () => {
      const supabase = createClientComponentClient();

      // 1) Exchange the code for a session (writes cookies)
      await supabase.auth.exchangeCodeForSession();

      // 2) Try to read role (profiles.role) and route by role
      let dest = next || "/";
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          const role = String(prof?.role || "").toUpperCase();
          if (role === "TECH") dest = "/tech";
          else if (role === "DISPATCH") dest = "/dispatch";
          else if (role === "SUPERADMIN") dest = "/office";
          else dest = "/fm/requests/new";
        }
      } catch {
        // if anything fails, fall back to `next`
      }

      router.replace(dest);
    })();
  }, [router, next]);

  return null;
}
