// app/api/requests/[id]/assign/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { id: string };
type RouteContext = { params: Promise<Params> };

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await supabaseServer();

  const body = await req.json().catch(() => null);
  if (!body || !body.tech_id) {
    return NextResponse.json(
      { error: "tech_id is required" },
      { status: 400 }
    );
  }

  const { tech_id } = body;

  const { error } = await supabase
    .from("requests")
    .update({
      assigned_tech: tech_id,
      status: "SCHEDULED", // dispatcher owns scheduling
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { message: "Technician assigned successfully" },
    { status: 200 }
  );
}
