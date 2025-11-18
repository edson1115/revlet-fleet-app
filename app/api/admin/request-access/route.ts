// app/api/admin/request-access/route.ts
import { NextResponse } from "next/server";

/**
 * Temporary stub for admin request-access.
 * Just returns ok:true so the UI doesn’t break.
 * You can hook this to real logic later.
 */

export async function POST() {
  return NextResponse.json({ ok: true });
}
