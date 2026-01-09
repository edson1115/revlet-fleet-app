import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export async function GET() {
  const scope = await resolveUserScope();
  
  if (!scope.uid || !["ADMIN", "SUPERADMIN"].includes(scope.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const formattedUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.user_metadata?.full_name || u.user_metadata?.name,
    role: u.user_metadata?.role,
    confirmed_at: u.email_confirmed_at,
    created_at: u.created_at
  }));

  return NextResponse.json({ users: formattedUsers });
}