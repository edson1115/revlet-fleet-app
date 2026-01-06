import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// GET: List parts
export async function GET(req: Request, { params }: any) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("request_parts")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  if (error) {
      console.error("❌ GET Parts Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ ok: true, rows: data });
}

// POST: Add a new part
export async function POST(req: Request, { params }: any) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // 🔍 LOGGING THE INPUT
    console.log("📝 Attempting to add part:", { request_id: id, ...body });

    const supabase = await supabaseServer();

    // Validate inputs
    if (!body.part_name) return NextResponse.json({ error: "Missing Name" }, { status: 400 });

    const { data, error } = await supabase
      .from("request_parts")
      .insert({
        request_id: id,
        part_name: String(body.part_name),
        part_number: body.part_number ? String(body.part_number) : null,
        quantity: Number(body.quantity) || 1, // Force Number type
        vendor: body.vendor ? String(body.vendor) : null,
        status: "ORDERED"
      })
      .select()
      .single();

    if (error) {
        // 🚨 CRITICAL: Log the database error
        console.error("❌ Database Insert Error:", error);
        return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, part: data });

  } catch (err: any) {
      console.error("❌ Server Crash:", err);
      return NextResponse.json({ error: "Server Exception", details: err.message }, { status: 500 });
  }
}

// DELETE: Remove a part
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const supabase = await supabaseServer();
  const { error } = await supabase.from("request_parts").delete().eq("id", id!);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}