"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Me = {
  role?: string;
  market?: string;
  email?: string;
};

export default function TeslaTopBar() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });
      const js = await res.json();
      if (js.ok) setMe(js.user);
    })();
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
  }

  if (!me) return null;

  return (
    <div className="h-14 border-b bg-white flex items-center justify-between px-6">

      {/* LEFT — SESSION CONTEXT */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold uppercase tracking-wide">
          {me.role ?? "USER"}
        </span>

        <span className="text-gray-400">·</span>

        <span className="font-medium text-gray-700">
          {me.market ?? "—"}
        </span>
      </div>

      {/* RIGHT — USER */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">
          {me.email}
        </span>

        <button
          onClick={signOut}
          className="text-sm text-red-600 hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
