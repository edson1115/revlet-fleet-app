// app/api/requests/[id]/events/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/auth/scope";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: any) {
  try {
    const scope = await resolveUserScope();
    if (!scope.uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const sb = await supabaseServer();

    const { data, error } = await sb
      .from("service_events")
      .select("id, request_id, event_type, payload, created_at, user_id")
      .eq("request_id", params.id)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ rows: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: any) {
  try {
    const scope = await resolveUserScope();
    if (!scope.uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    if (!scope.isInternal && !scope.isSuper) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { event_type, payload } = body;

    if (!event_type) {
      return NextResponse.json({ error: "missing_event_type" }, { status: 400 });
    }

    const sb = await supabaseServer();

    const { error } = await sb.from("service_events").insert({
      request_id: params.id,
      event_type: event_type.toUpperCase(),
      payload: payload ?? null,
      user_id: scope.uid,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
