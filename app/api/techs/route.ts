import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServerRoute } from "@/lib/supabase/server-route";

function isAllowedRole(role?: string) {
  // adjust if you want OFFICE/DISPATCH/etc to see tech list
  return role === "ADMIN" || role === "SUPERADMIN" || role === "DISPATCH" || role === "DISPATCHER" || role === "OFFICE";
}

export async function GET() {
  // ✅ Auth check using SSR client (handles chunked cookies)
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

  // ✅ Service role query (no cookie/token parsing required)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, market_id")
    .in("role", ["TECH"])
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Techs API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}