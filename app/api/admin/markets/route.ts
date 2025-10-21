// app/api/admin/markets/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("[MARKETS_GET] start");
    const { ok, company_id } = await requireRole(["ADMIN"]);
    console.log("[MARKETS_GET] role-checked", { ok, company_id });

    if (!ok || !company_id) {
      console.warn("[MARKETS_GET] forbidden");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await supabaseServer();

    const { data, error } = await supabase
      .from("company_locations")
      .select("id,name,location_type")
      .eq("company_id", company_id)
      .eq("location_type", "MARKET")
      .order("name");

    if (error) {
      console.error("[MARKETS_GET] db error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[MARKETS_GET] rows", (data ?? []).length);
    return NextResponse.json((data ?? []).map((r) => ({ id: r.id, name: r.name })));
  } catch (e: any) {
    console.error("[MARKETS_GET] fatal", e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    console.log("[MARKETS_POST] start");
    const { ok, company_id } = await requireRole(["ADMIN"]);
    console.log("[MARKETS_POST] role-checked", { ok, company_id });

    if (!ok || !company_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const name: string | undefined = body?.name?.trim();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const supabase = await supabaseServer();
    const { error } = await supabase.from("company_locations").insert({
      company_id,
      name,
      location_type: "MARKET",
    } as any);

    if (error) {
      console.error("[MARKETS_POST] db error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[MARKETS_POST] fatal", e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
