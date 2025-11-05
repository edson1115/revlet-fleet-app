// app/api/images/sign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SignBody = {
  request_id: string;
  kind: "before" | "after" | "other";
  sha256: string;             // hex string of WORK bytes
  width: number;              // of WORK
  height: number;
  size_bytes: number;         // of WORK
  thumb_bytes: number;        // of THUMB
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SignBody;
    const { request_id, kind, sha256, width, height, size_bytes, thumb_bytes } = body || ({} as any);
    if (!request_id || !kind || !sha256 || !width || !height || !size_bytes || !thumb_bytes) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Auth + company scope
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile, error: pErr } = await supabase
      .from("profiles").select("id, company_id").eq("id", user.id).single();
    if (pErr || !profile?.company_id) return NextResponse.json({ error: "No company scope" }, { status: 403 });

    // Ensure the request belongs to the same company
    const { data: reqRow, error: rErr } = await supabase
      .from("service_requests").select("id, company_id").eq("id", request_id).single();
    if (rErr || !reqRow || reqRow.company_id !== profile.company_id) {
      return NextResponse.json({ error: "Request not found in company" }, { status: 404 });
    }

    // Dedupe by sha256
    const { data: dup } = await supabase
      .from("images")
      .select("id, url_work, url_thumb, key_work, key_thumb")
      .eq("company_id", profile.company_id)
      .eq("sha256", sha256)
      .maybeSingle();

    if (dup) {
      // Already exists in company → reuse
      return NextResponse.json({
        reused: true,
        id: dup.id,
        upload_work: null,
        upload_thumb: null,
        url_work: dup.url_work,
        url_thumb: dup.url_thumb,
      });
    }

    // Pre-create DB row (URLs will be public, bucket is 'proof')
    const id = crypto.randomUUID();
    const baseKey = `images/${profile.company_id}/${request_id}/${id}`;
    const keyWork = `${baseKey}/work.webp`;
    const keyThumb = `${baseKey}/thumb.webp`;

    // Public URLs (since bucket is Public)
    const publicBase = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const url_work = `${publicBase}/storage/v1/object/public/proof/${keyWork}`;
    const url_thumb = `${publicBase}/storage/v1/object/public/proof/${keyThumb}`;

    // Insert row so we can reference it on commit even if client drops
    const { error: iErr } = await supabase.from("images").insert({
      id,
      company_id: profile.company_id,
      request_id,
      kind,
      url_work,
      url_thumb,
      key_work: keyWork,
      key_thumb: keyThumb,
      sha256,
      width, height,
      size_bytes, thumb_bytes,
      taken_by: profile.id,
      // expires_at default handles +90d
    });
    if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

    // Signed upload URLs (write)
    const storage = supabase.storage.from("proof");
    const workSigned = await storage.createSignedUploadUrl(keyWork);
    if (!workSigned?.data?.signedUrl) {
      return NextResponse.json({ error: "Failed to sign upload (work)" }, { status: 500 });
    }
    const thumbSigned = await storage.createSignedUploadUrl(keyThumb);
    if (!thumbSigned?.data?.signedUrl) {
      return NextResponse.json({ error: "Failed to sign upload (thumb)" }, { status: 500 });
    }

    return NextResponse.json({
      reused: false,
      id,
      upload_work: workSigned.data.signedUrl,
      upload_thumb: thumbSigned.data.signedUrl,
      url_work,      // final public URLs
      url_thumb,
      cache_control: "public, max-age=31536000, immutable"
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
