import { NextResponse } from "next/server";
import { resolveUserScope } from "@/lib/api/scope";

// FIX: Type the arguments explicitly
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  // FIX: Await params for Next.js 15
  const params = await props.params;
  
  const scope = await resolveUserScope();
  if (!scope.isCustomer) return NextResponse.json({ ok: false }, { status: 401 });

  // Mock next service logic for now
  return NextResponse.json({
    ok: true,
    service: {
      type: "Oil Change",
      due_date: "2025-12-01",
      miles_remaining: 3400
    }
  });
}