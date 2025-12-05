// app/api/service-templates/route.ts

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

//
// GET — list templates
//
export async function GET() {
  const supabase = await supabaseServer(); // <-- FIXED

  const { data, error } = await supabase
    .from("service_templates")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ templates: data });
}

//
// POST — create a template
//
export async function POST(req: Request) {
  const supabase = await supabaseServer(); // <-- FIXED

  const body = await req.json();

  const { data, error } = await supabase
    .from("service_templates")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ created: data });
}



