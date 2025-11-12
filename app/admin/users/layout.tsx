// app/admin/users/layout.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function AdminUsersLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Next 15 adapter: use get/set/remove (NOT getAll/setAll)
        get: (name: string) => jar.get(name)?.value,
        set: (name: string, value: string, options?: Parameters<typeof jar.set>[0]) =>
          jar.set({ name, value, ...options }),
        remove: (name: string, options?: Parameters<typeof jar.set>[0]) =>
          jar.set({ name, value: "", ...options, expires: new Date(0) }),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/?msg=signin");

  const superEmails = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  // read caller’s role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(profile?.role || "").toUpperCase();
  const isSuper =
    superEmails.includes((user.email || "").toLowerCase()) || role === "SUPERADMIN";

  if (!isSuper) redirect("/?msg=forbidden");

  return <>{children}</>;
}
