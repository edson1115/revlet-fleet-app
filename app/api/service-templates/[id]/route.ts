// app/api/service-templates/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** GET /api/service-templates/:id */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("service_templates")
    .select(
      `
        id,
        name,
        description,
        default_service,
        created_at,
        updated_at
      `
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 200 });
}

/** PATCH /api/service-templates/:id */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await supabaseServer();
  const body = await req.json();

  const { data, error } = await supabase
    .from("service_templates")
    .update({
      name: body.name ?? undefined,
      description: body.description ?? undefined,
      default_service: body.default_service ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 200 });
}

/** DELETE /api/service-templates/:id */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("service_templates")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
