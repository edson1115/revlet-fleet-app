import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

// ⚠️ ADMIN CLIENT
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const isAuthorized = (role: string) => {
  return ["ADMIN", "SUPERADMIN", "SUPER_ADMIN"].includes(role);
};

export async function GET() {
  const scope = await resolveUserScope();

  if (!scope.uid || !isAuthorized(scope.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const formattedUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.user_metadata?.full_name || u.user_metadata?.name || "Unknown",
    role: u.user_metadata?.role || "N/A",
    customer_id: u.user_metadata?.customer_id || null,
    
    // 🔥 THE FIX: We infer "Has Password" if their email is confirmed OR they have signed in.
    has_password: !!u.email_confirmed_at || !!u.last_sign_in_at,
    
    email_confirmed: !!u.email_confirmed_at,
    last_sign_in: u.last_sign_in_at,
    created_at: u.created_at
  }));

  return NextResponse.json({ users: formattedUsers });
}

// ... (Keep DELETE and PATCH the same as before) ...
export async function DELETE(request: Request) {
  const scope = await resolveUserScope();
  if (!scope.uid || !["SUPERADMIN", "SUPER_ADMIN"].includes(scope.role)) {
      return NextResponse.json({ error: "Only Super Admins can delete users" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId!);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const scope = await resolveUserScope();
  if (!scope.uid || !isAuthorized(scope.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const body = await request.json();
  const { userId, role } = body;
  
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { role: role }
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  
  await supabaseAdmin.from('profiles').update({ role }).eq('id', userId);
  return NextResponse.json({ success: true });
}