// app/api/images/list/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

function parseKindFromName(name: string): "before" | "after" | "other" {
  const m = name.match(/-(before|after|other)\./i);
  return ((m?.[1] || "other").toLowerCase() as "before" | "after" | "other");
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    // Tech page sends a single CSV param encoded once
    const csv = decodeURIComponent(url.searchParams.get("request_ids") || "");
    const ids = csv.split(",").map((s) => s.trim()).filter(Boolean);
    if (!ids.length) return NextResponse.json({ byRequest: {} });

    const BUCKET = process.env.NEXT_PUBLIC_IMAGES_BUCKET || "work-photos";
    const sb = supabaseAdmin();

    const byRequest: Record<string, { id: string; kind: string; url_thumb: string; url_work: string; taken_at?: string }[]> = {};

    for (const rid of ids) {
      const { data: entries, error } = await sb.storage.from(BUCKET).list(rid, { limit: 200 });
      if (error) {
        byRequest[rid] = [];
        continue;
      }
      const rows =
        entries?.filter((e) => e.name && !e.name.endsWith("/")).map((e) => {
          const path = `${rid}/${e.name}`;
          const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
          return {
            id: path,
            kind: parseKindFromName(e.name),
            url_work: pub?.publicUrl || "",
            url_thumb: pub?.publicUrl || "",
            taken_at: e.created_at || undefined,
          };
        }) || [];
      byRequest[rid] = rows;
    }

    return NextResponse.json({ byRequest });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to list images" }, { status: 400 });
  }
}
