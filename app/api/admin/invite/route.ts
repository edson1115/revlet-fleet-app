import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveUserScope } from "@/lib/api/scope";

export async function POST(req: Request) {
  const scope = await resolveUserScope();
  
  // 🛑 Security: Only Admin or SuperAdmin can invite others
  if (!scope.uid || !["ADMIN", "SUPERADMIN"].includes(scope.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, role, name } = await req.json();

  if (!email || !role) {
    return NextResponse.json({ error: "Email and Role are required" }, { status: 400 });
  }

  // Use Service Role Key to bypass RLS and create users
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Invite the user via Supabase Auth
  // This sends an email to the user to set their password
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { 
      role: role,
      full_name: name 
    }
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, user: data.user });
}