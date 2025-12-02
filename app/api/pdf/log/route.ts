import { NextResponse } from "next/server";
import { logPDF } from "@/lib/pdf/log";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requestId, action, actor, actorEmail, meta } = body;

    if (!requestId || !action)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    await logPDF({
      requestId,
      action,
      actor,
      actorEmail,
      meta,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
