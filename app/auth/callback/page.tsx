// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import toast from "react-hot-toast";

export default function AuthCallback() {
  const router = useRouter();
  const sp = useSearchParams();
  const code = sp.get("code");

  useEffect(() => {
    async function finish() {
      if (!code) {
        router.replace("/login");
        return;
      }

      const supabase = supabaseBrowser();

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth error:", error);
        toast.error("Sign-in failed");
        router.replace("/login?error=1");
        return;
      }

      router.replace("/");
    }

    finish();
  }, [code, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center animate-fade-in">
      <p className="text-gray-600">Completing sign-in…</p>
    </div>
  );
}
