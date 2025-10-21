// app/(public)/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Role = "ADMIN" | "OFFICE" | "DISPATCH" | "TECH" | "CUSTOMER" | null;

const ROLE_LANDING: Record<Exclude<Role, null>, string> = {
  ADMIN: "/admin",
  OFFICE: "/office/queue",
  DISPATCH: "/dispatch/scheduled",
  TECH: "/tech/queue",
  CUSTOMER: "/fm/requests/new",
};

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? null;

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // If already signed in, bounce to role landing (or ?next=…)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        const m = await r.json();
        if (m?.authenticated) {
          if (next) router.replace(next);
          else {
            const role = (m.role as Role) ?? null;
            router.replace(role ? ROLE_LANDING[role] : "/");
          }
        }
      } catch {}
    })();
  }, [router, next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMsg(null);
    try {
      const r = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to send link");
      setMsg("Check your email for the sign-in link.");
    } catch (err: any) {
      setMsg(err.message || "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded p-2"
        />
        <button className="w-full rounded bg-black text-white py-2" disabled={sending}>
          {sending ? "Sending…" : "Send magic link"}
        </button>
      </form>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </main>
  );
}
