// app/api/me/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole, roleToPermissions } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ ok: false, role: null });

  const role = normalizeRole(user.user_metadata.role);
  return NextResponse.json({
    ok: true,
    role,
    perms: roleToPermissions(role),
  });
}
