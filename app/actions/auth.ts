// app/actions/auth.ts
"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { permsFor } from "@/lib/permissions";

/** Read the current user on the server and compute permissions. */
export async function getMeServer() {
  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return {
      authed: false as const,
      me: null as {
        role?: string | null;
        name?: string | null;
        email?: string | null;
      } | null,
      permissions: permsFor(null),
    };
  }

  const u = data.user;
  const role =
    (u.user_metadata?.role as string | undefined) ??
    (u.app_metadata?.role as string | undefined) ??
    ("VIEWER" as const);

  const me = {
    role,
    name: (u.user_metadata?.name as string | null) ?? null,
    email: (u.email as string | null) ?? null,
  };

  return {
    authed: true as const,
    me,
    permissions: permsFor(role),
  };
}

/** Require any signed-in user, otherwise send to login. */
export async function requireAuth() {
  const { authed } = await getMeServer();
  if (!authed) redirect("/login");
}

/** Require a specific capability; otherwise go home. */
export async function requireCapability(
  predicate: (p: ReturnType<typeof permsFor>) => boolean
) {
  const { authed, permissions } = await getMeServer();
  if (!authed) redirect("/login");
  if (!predicate(permissions)) redirect("/");
}
