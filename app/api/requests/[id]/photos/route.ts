import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createId } from "@paralleldrive/cuid2";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function detectKind(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Classify this photo: BEFORE, AFTER, DAMAGE, OTHER" },
          {
            type: "image_url",
            image_url: `data:image/jpeg;base64,${base64}`,
          },
        ],
      },
    ],
  });

  const label = res?.choices?.[0]?.message?.content?.trim()?.toUpperCase();

  if (["BEFORE", "AFTER", "DAMAGE"].includes(label)) return label;
  return "OTHER";
}

export async function POST(req: Request, { params }: any) {
  const id = params.id;
  const form = await req.formData();

  const file = form.get("file") as File;
  let kind = (form.get("kind") as string) || null;
  
  if (!file) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!kind) {
    kind = await detectKind(file);
  }

  const photoId = createId();
  const ext = file.name.split(".").pop();
  const path = `requests/${id}/${photoId}.${ext}`;

  const { data: upload, error: uploadErr } = await supabaseAdmin.storage
    .from("request-photos")
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from("request-photos")
    .getPublicUrl(path);

  const { data, error } = await supabaseAdmin
    .from("request_photos")
    .insert({
      id: photoId,
      request_id: id,
      url: urlData.publicUrl,
      kind,
    })
    .select()
    .single();

  return NextResponse.json({ photo: data });
}
