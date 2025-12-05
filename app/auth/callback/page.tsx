"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const code = sp.get("code");
    const next = sp.get("next") ?? "/";

    if (!code) {
      router.replace("/login?error=no_code");
      return;
    }

    router.replace(`/auth/callback/finish?code=${code}&next=${next}`);
  }, [router, sp]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <p className="text-gray-600">Completing sign-in…</p>
    </div>
  );
}



