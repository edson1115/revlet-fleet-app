import { resolveUserScope } from "@/lib/api/scope";
import { NextResponse } from "next/server";

export async function GET() {
  const scope = await resolveUserScope();
  return NextResponse.json({ scope });
}



