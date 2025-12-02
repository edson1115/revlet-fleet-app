import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await supabaseServer();

    const { data: row, error } = await supabase
      .from("pdf_shares")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) throw new Error("Share link not found");

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }

    return new NextResponse(row.pdf_bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="service-report.pdf"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
