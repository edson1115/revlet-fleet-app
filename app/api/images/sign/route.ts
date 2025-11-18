// app/api/images/sign/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { request_id, kind } = await req.json();

    if (!request_id || !kind) {
      return NextResponse.json(
        { error: "Missing request_id or kind" },
        { status: 400 }
      );
    }

    // FIX: Must await supabaseServer()
    const supabase = await supabaseServer();

    // FIX: supabase.auth.getUser()
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      return NextResponse.json(
        { error: userErr.message },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Optional: scopes by user’s customer/company
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (pErr) {
      return NextResponse.json(
        { error: pErr.message },
        { status: 400 }
      );
    }

    // Generate storage signed URL
    const filePath = `${request_id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.jpg`;

    const { data: signed, error: sErr } = await supabase.storage
      .from("service-images")
      .createSignedUploadUrl(filePath);

    if (sErr || !signed) {
      return NextResponse.json(
        { error: sErr?.message || "Cannot create signed URL" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      uploadUrl: signed.signedUrl,
      path: filePath,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
