"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const supabase = supabaseBrowser();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // 100% REQUIRED OR MAGIC LINKS WILL LOOP
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      console.error(error);
      setStatus("error");
      return;
    }

    setStatus("sent");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 max-w-sm mx-auto mt-12 p-6 border rounded"
    >
      <h1 className="text-xl font-semibold text-center">Sign in</h1>

      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full border px-3 py-2 rounded"
      />

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Send Magic Link"}
      </button>

      {status === "sent" && (
        <p className="text-green-600 text-center">
          Magic link sent! Check your email.
        </p>
      )}

      {status === "error" && (
        <p className="text-red-600 text-center">
          There was a problem sending your link.
        </p>
      )}
    </form>
  );
}
