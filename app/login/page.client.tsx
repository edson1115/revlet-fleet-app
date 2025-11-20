// app/login/page.client.tsx
"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import toast from "react-hot-toast";

export default function LoginClient() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to send sign-in link");
      return;
    }

    toast.success("Magic link sent! Check your email.");
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in px-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md border border-gray-100">

        <h1 className="text-2xl font-semibold mb-2 text-center">
          Sign In
        </h1>

        <p className="text-gray-600 text-center mb-8">
          Enter your work email to receive a secure sign-in link.
        </p>

        <form onSubmit={sendMagicLink} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-xl bg-[#F5F5F5] px-4 py-3 text-sm outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#80FF44] text-black py-3 rounded-xl font-medium hover:opacity-90 transition"
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </button>
        </form>
      </div>
    </main>
  );
}
