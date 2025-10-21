// app/api/admin/request-access/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id || null;

  if (uid) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", uid)
      .maybeSingle();
    if (prof?.company_id) return { supabase, company_id: prof.company_id as string };
  }

  const { data: v } = await supabase
    .from("vehicles")
    .select("company_id")
    .not("company_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { supabase, company_id: (v?.company_id as string) ?? null };
}

export async function POST(req: Request) {
  try {
    const { supabase, company_id } = await resolveCompanyId();

    // Optional: capture email / reason if provided by client
    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      reason?: string | null;
      role?: "CUSTOMER" | "OFFICE" | "DISPATCH" | "TECH" | "ADMIN" | "FLEET_MANAGER";
    };

    // Best-effort insert; if table doesn't exist, don't break the flow
    if (body?.email) {
      const { error } = await supabase.from("access_requests").insert({
        email: body.email,
        reason: body.reason ?? null,
        requested_role: body.role ?? null,
        company_id: company_id ?? null,
      });
      if (error) {
        console.warn("[/api/admin/request-access] insert failed:", error.message);
      }
    }

    return NextResponse.json({ ok: true, company_id: company_id ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function GET() {
  // Simple health check
  return NextResponse.json({ ok: true });
}
