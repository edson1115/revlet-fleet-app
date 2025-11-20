"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AuthCallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const code = sp.get("code");
    if (!code) {
      router.replace("/?error=no_code");
      return;
    }

    const supabase = supabaseBrowser();

    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error(error);
        router.replace("/?error=auth_failed");
        return;
      }

      router.replace("/");
    })();
  }, [router, sp]);

  return (
    <div className="p-6 text-center">
      <p>Completing sign-in…</p>
    </div>
  );
}
