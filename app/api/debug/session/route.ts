import { NextResponse } from "next/server";
import { supabaseServerRoute } from "@/lib/supabase/server-route";

export async function GET() {
  const supabase = await supabaseServerRoute();
  const { data, error } = await supabase.auth.getSession();

  return NextResponse.json({ data, error });
}
