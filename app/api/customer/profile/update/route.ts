import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const body = await req.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const fields = {
    full_name: body.full_name,
    phone: body.phone,
    company: body.company,
    fleet_size: body.fleet_size,
  };

  const { error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", user.id);

  if (error)
    return NextResponse.json({ ok: false, error }, { status: 500 });

  return NextResponse.json({ ok: true });
}
