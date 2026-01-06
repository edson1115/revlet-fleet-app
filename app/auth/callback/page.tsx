"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Authenticating...");

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        setStatus("Securing session...");

        try {
          // 1. Ask Server to set cookie AND decide destination
          const response = await fetch("/api/auth/set-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }),
          });

          const result = await response.json();

          if (result.success && result.redirectUrl) {
            setStatus(`Redirecting to Portal...`);
            console.log("Server commanded redirect to:", result.redirectUrl);
            
            // 2. HARD RELOAD to Ensure Cookies are Active
            window.location.href = result.redirectUrl; 
          } else {
            console.error("Session sync failed:", result.error);
            setStatus("Connection error. Redirecting to home...");
            setTimeout(() => window.location.href = "/admin", 2000);
          }

        } catch (e) {
          console.error("Network error:", e);
          window.location.href = "/admin";
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center max-w-sm w-full animate-in fade-in zoom-in duration-300">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-lg font-bold text-gray-900">{status}</h2>
        <p className="text-gray-400 text-xs mt-2">Connecting to Command Center...</p>
      </div>
    </div>
  );
}