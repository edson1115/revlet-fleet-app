// app/api/admin/set-role/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Temporary stub for setting user roles.
 * For MVP build: this simply returns ok:true.
 * Later, you can implement real RBAC updates here.
 */

export async function POST(req: NextRequest) {
  // You *could* log or inspect body if you want:
  // const { id, role } = await req.json();

  return NextResponse.json({ ok: true });
}
