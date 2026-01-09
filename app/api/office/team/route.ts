import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"; // Admin client
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export async function GET() {
  const scope = await resolveUserScope();
  if (!scope.uid || scope.role !== "OFFICE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use Admin Client to read Auth Users
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all users
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter for only TECH roles
  const techs = users
    .filter(u => u.user_metadata?.role === 'TECH')
    .map(u => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name || u.email?.split('@')[0] || "Unknown Tech"
    }));

  return NextResponse.json({ techs });
}