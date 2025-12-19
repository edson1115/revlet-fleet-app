import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await supabaseServer();
    const requestId = params.id;

    const { status } = await req.json();

    if (status !== "READY_TO_SCHEDULE") {
      return NextResponse.json(
        { error: "Office can only mark READY_TO_SCHEDULE" },
        { status: 403 }
      );
    }

    /* AUTH */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* PROFILE */
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active_market")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      !["OFFICE", "ADMIN", "SUPERADMIN"].includes(profile.role)
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    /* UPDATE */
    const { error } = await supabase
      .from("service_requests")
      .update({
        status: "READY_TO_SCHEDULE",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: "READY_TO_SCHEDULE",
    });
  } catch (err: any) {
    console.error("Office status error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
