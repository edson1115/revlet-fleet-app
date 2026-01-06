import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function POST(req: Request) {
  const scope = await resolveUserScope();
  if (!scope.uid || scope.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("customers")
    .update({
      name: body.company_name,
      phone: body.phone,
      email: body.billing_email,
      status: "PENDING_REVIEW",
      onboarding_completed: true,
      created_by: "CUSTOMER",
    })
    .eq("id", scope.customerId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });

  // 🔑 Set cookie used by middleware
  res.cookies.set("onboarding_complete", "true", {
    path: "/",
    httpOnly: false,
  });

  return res;
}
