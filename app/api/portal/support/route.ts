// app/api/portal/support/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const text = (body?.text || "").trim();

    if (!text) {
      return NextResponse.json({ error: "message_required" }, { status: 400 });
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const customer_id = prof?.customer_id ?? null;

    const { error } = await supabase
      .from("support_messages")
      .insert({
        user_id: user.id,
        customer_id,
        message: text,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}



