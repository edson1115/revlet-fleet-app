// app/tech/login/page.tsx
"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function TechLoginPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  async function handleLogin() {
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      setErr(error.message);
      return;
    }

    router.push("/tech");
  }

  return (
    <div className="max-w-sm mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Technician Login</h1>

      <input
        className="w-full border p-3 rounded"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        className="w-full border p-3 rounded"
        placeholder="Password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <button
        onClick={handleLogin}
        className="w-full py-3 rounded bg-black text-white font-semibold"
      >
        Login
      </button>
    </div>
  );
}



