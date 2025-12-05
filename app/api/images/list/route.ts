// app/api/images/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { resolveUserScope } from "@/lib/api/scope";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // MUST AWAIT
  const supabase = await supabaseServer();
  const scope = await resolveUserScope();

  if (!scope.uid) {
    return NextResponse.json(
      { ok: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const idsRaw = url.searchParams.get("request_ids");

  if (!idsRaw) {
    return NextResponse.json(
      { ok: false, error: "Missing request_ids" },
      { status: 400 }
    );
  }

  const ids = idsRaw.split(",").map((x) => x.trim());

  // 👉 Correct table name: request_images
  const { data, error } = await supabase
    .from("request_images")
    .select("*")
    .in("request_id", ids)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("/api/images/list error:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  // Group results
  const grouped: Record<string, any[]> = {};
  for (const row of data || []) {
    if (!grouped[row.request_id]) grouped[row.request_id] = [];
    grouped[row.request_id].push(row);
  }

  return NextResponse.json({
    ok: true,
    byRequest: grouped,
  });
}



