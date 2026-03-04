import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServerRoute } from "@/lib/supabase/server-route";

function isAdminRole(role?: string) {
  return role === "ADMIN" || role === "SUPERADMIN";
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
  if (!isAdminRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ✅ Use service role for analytics queries (bypass any RLS headaches)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Total customers
  const { count: totalCustomers, error: customersError } = await supabaseAdmin
    .from("customers")
    .select("*", { count: "exact", head: true });

  if (customersError) {
    console.error("Analytics customersError:", customersError);
  }

  // Total invoices (optional)
  const { count: totalInvoices, error: invoicesError } = await supabaseAdmin
    .from("invoices")
    .select("*", { count: "exact", head: true });

  if (invoicesError) {
    console.error("Analytics invoicesError:", invoicesError);
  }

  // Total users (profiles) if table exists
  const { count: totalUsers, error: usersError } = await supabaseAdmin
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (usersError) {
    console.warn("Analytics usersError (profiles may be restricted/missing):", usersError);
  }

  return NextResponse.json({
    totalCustomers: totalCustomers ?? 0,
    totalInvoices: totalInvoices ?? 0,
    totalUsers: totalUsers ?? 0,
  });
}