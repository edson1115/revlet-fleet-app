"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SignInForm({ next = "/" }: { next?: string }) {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMsg(null);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Always land on our callback so cookies get written
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
              : undefined,
        },
      });
      if (error) throw error;
      setMsg("Check your inbox for your secure sign-in link.");
    } catch (e: any) {
      setErr(e?.message ?? "Could not send magic link");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={sendLink} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block">Email</span>
        <input
          type="email"
          required
          className="w-full border rounded px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
      </label>

      <button
        type="submit"
        disabled={sending || !email}
        className="w-full rounded border px-4 py-2 font-medium"
      >
        {sending ? "Sending…" : "Email me a magic link"}
      </button>

      {msg && <p className="mt-2 text-green-600 text-sm">{msg}</p>}
      {err && <p className="mt-2 text-red-600 text-sm">{err}</p>}
    </form>
  );
}
