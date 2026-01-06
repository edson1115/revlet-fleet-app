import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const scope = await resolveUserScope();
    // Only Office/Admin/Dispatch can see customer lists
    if (!scope.uid || !["OFFICE", "ADMIN", "SUPERADMIN", "DISPATCH"].includes(scope.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await supabaseServer();
    
    // Fetch customers
    const { data: customers, error } = await supabase
      .from("customers")
      .select("id, name, email")
      .order("name", { ascending: true })
      .limit(500);

    if (error) throw error;

    return NextResponse.json({ ok: true, rows: customers });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}