// app/api/me/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id || null;

  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: prof, error } = await supabase
    .from("profiles")
    .select("id, role, company_id, customer_id, full_name, email")
    .eq("id", uid)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    id: uid,
    role: prof?.role || auth?.user?.user_metadata?.role || null,
    company_id: prof?.company_id || auth?.user?.user_metadata?.company_id || null,
    customer_id: prof?.customer_id || auth?.user?.user_metadata?.customer_id || null,
    name: prof?.full_name || auth?.user?.user_metadata?.full_name || null,
    email: prof?.email || auth?.user?.email || null,
  });
}
