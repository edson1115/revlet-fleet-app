// lib/auth/requireRole.ts

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export function json(body: any, status = 200) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function requireRole(req: Request, allowed: string[]) {
  const supabase = await supabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return json({ error: "Unauthorized" }, 401);
  }

  const role =
    (session.user.app_metadata as any)?.role?.toUpperCase?.() || "VIEWER";

  if (!allowed.includes(role)) {
    return json({ error: "Forbidden" }, 403);
  }

  return null; // allowed
}
