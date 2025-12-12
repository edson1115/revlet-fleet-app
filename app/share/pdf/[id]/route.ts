import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("pdf_shares")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (new Date(data.expires_at).getTime() < Date.now())
    return NextResponse.json({ error: "Link expired" }, { status: 410 });

  return new NextResponse(data.pdf_bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=service-report.pdf",
    },
  });
}
