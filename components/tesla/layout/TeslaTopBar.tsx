"use client";

import { useEffect, useState } from "react";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

export function TeslaTopBar() {
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })   // ✔ FIXED
      .then(r => r.json())
      .then(setMe)
      .catch(() => setMe(null));                   // safety fallback
  }, []);

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-8">

      <div className="text-lg font-semibold tracking-tight">
        Revlet
      </div>

      <div className="flex items-center gap-4">
        {me?.role && (
          <TeslaStatusChip status={me.role} />
        )}

        <button
          onClick={() => window.location.href = "/auth/signout"}
          className="text-sm text-gray-600 hover:text-black"
        >
          Sign Out
        </button>
      </div>

    </header>
  );
}
