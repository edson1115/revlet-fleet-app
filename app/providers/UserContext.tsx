// app/providers/UserContext.tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Me = {
  authenticated: boolean;
  email?: string | null;
  role?: "ADMIN" | "OFFICE" | "DISPATCH" | "TECH" | "CUSTOMER" | null;
  customer_id?: string | null;
  company_id?: string | null;
};

const Ctx = createContext<Me>({ authenticated: false });
export const useMe = () => useContext(Ctx);

export function MeProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me>({ authenticated: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();
        if (mounted) setMe(data);
      } catch {
        if (mounted) setMe({ authenticated: false });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return <Ctx.Provider value={me}>{children}</Ctx.Provider>;
}
