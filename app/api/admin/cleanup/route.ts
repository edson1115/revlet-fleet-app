// app/api/admin/cleanup/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Temporary stub for admin cleanup.
 * Keeps the route compiling without pulling in Supabase cookie plumbing.
 * You can wire real cleanup logic later.
 */

export async function POST(_req: NextRequest) {
  return NextResponse.json({
    ok: true,
    message: "Admin cleanup stubbed for this build.",
  });
}

// (Optional) support GET as well, if something calls it via GET
export async function GET(_req: NextRequest) {
  return NextResponse.json({
    ok: true,
    message: "Admin cleanup stubbed for this build.",
  });
}
