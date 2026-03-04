import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServerRoute } from "@/lib/supabase/server-route";

function isAllowedRole(role?: string) {
  return role === "SUPERADMIN" || role === "ADMIN";
}

export async function GET() {
  const supabaseAuth = await supabaseServerRoute();
  const {
    data: { user },
    error: userErr,
  } = await supabaseAuth.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (user.user_metadata?.role as string | undefined) ?? undefined;
  if (!isAllowedRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("markets")
    .select("*")
    .order("created_at", { ascending: false });

  // If the table doesn't exist (PGRST205), return empty list instead of 500
  if (error) {
    console.warn("Markets API Error:", error);

    if (error.code === "PGRST205") {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? [], { status: 200 });
}