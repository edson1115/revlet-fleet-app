import { NextResponse } from "next/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function GET(req, { params }) {
  const scope = await resolveUserScope();
  if (!scope.isCustomer) return NextResponse.json({ ok: false }, { status: 401 });

  return NextResponse.json({
    ok: true,
    next_service: {
      message: "Oil change recommended in ~1,200 miles",
    },
  });
}
