import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-helpers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // In Next.js 15, params must be awaited
  const { id } = await params;
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select(`
        *,
        provider_company:provider_companies(id, name)
      `)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }

    // Safely format the provider name if it exists
    const providerData = data.provider_company as any;
    const vehicle = {
      ...data,
      provider_name: providerData?.name || null,
    };

    return NextResponse.json({ ok: true, vehicle });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const body = await req.json();
    
    // Clean up the body to remove fields we don't want to save directly
    // (like the joined provider_company object)
    const { provider_company, provider_name, ...updateData } = body;

    const { error } = await supabase
      .from("vehicles")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}