// app/api/technicians/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const scope = await resolveUserScope();
    if (!scope.uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const supabase = await supabaseServer();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, market")
      .eq("role", "TECH")
      .order("full_name");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const techs = (data || []).map((t) => ({
      id: t.id,
      full_name: t.full_name,
      market: t.market ?? null,
      role: "TECH",
    }));

    return NextResponse.json(techs);

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "failed" },
      { status: 500 }
    );
  }
}



