"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function ConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    // Initialize standard client (safe for browser)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // This listener catches the implicit #access_token hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session) {
          // Force a hard refresh to ensure cookies are seen by the server
          window.location.href = "/admin/users";
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center animate-pulse">
        <h2 className="text-2xl font-bold text-gray-900">Verifying Login...</h2>
        <p className="text-gray-500">Please wait while we secure your session.</p>
      </div>
    </div>
  );
}