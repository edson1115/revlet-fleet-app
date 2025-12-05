import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { normalizeRole } from "@/lib/permissions";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${
            cookies().get("sb-access-token")?.value || ""
          }`,
        },
      },
    }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;
    const supabase = await supabaseServer();

    // ------------------------------
    // AUTH
    // ------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = normalizeRole(user.user_metadata?.role);

    const INTERNAL_ROLES = new Set([
      "OFFICE",
      "FLEET_MANAGER",
      "ADMIN",
      "SUPERADMIN",
    ]);

    if (!INTERNAL_ROLES.has(role || "")) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // ------------------------------
    // PAYLOAD
    // ------------------------------
    const body = await req.json();
    const notes: string = body.notes ?? "";

    // ------------------------------
    // UPDATE REQUEST
    // ------------------------------
    const { error } = await supabase
      .from("requests")
      .update({ notes })
      .eq("id", requestId);

    if (error) {
      console.error("UPDATE NOTES ERROR:", error);
      return NextResponse.json(
        { error: "Failed to update notes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
