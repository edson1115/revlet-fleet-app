// app/api/vehicles/[id]/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Helper to extract ID from URL
function getId(url: string) {
  const parts = new URL(url).pathname.split("/");
  return parts[parts.length - 2]; // because path is /vehicles/[id]/history
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const id = getId(req.url);

    if (!id || id.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Invalid vehicle ID" },
        { status: 400 }
      );
    }

    // Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Call RPC
    const { data, error } = await supabase.rpc("get_vehicle_history", {
      v_id: id,
    });

    if (error) {
      console.error("RPC get_vehicle_history error:", error);
      return NextResponse.json(
        { ok: false, error: "Vehicle history failed" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "Vehicle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      vehicle: data,
    });
  } catch (err: any) {
    console.error("API ERROR /vehicles/[id]/history:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
