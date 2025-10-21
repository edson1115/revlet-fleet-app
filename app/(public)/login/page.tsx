// app/(public)/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setErr(null), [email]);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMsg(null);
    setErr(null);
    try {
      const supabase = supabaseClient();

      // Build a redirect back to this app
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) throw error;
      setMsg(
        "Check your email for a login link. Open it on this device to complete sign-in."
      );
    } catch (e: any) {
      setErr(e?.message ?? "Failed to send magic link.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-sm text-gray-600">
        Enter your email and we’ll send you a one-time sign-in link.
      </p>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-xl px-3 py-2"
        />
        <button
          type="submit"
          disabled={sending || !email.trim()}
          className="w-full px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send magic link"}
        </button>
      </form>

      {msg && <div className="text-green-700 bg-green-50 p-3 rounded-lg">{msg}</div>}
      {err && <div className="text-red-700 bg-red-50 p-3 rounded-lg">{err}</div>}
    </div>
  );
}
