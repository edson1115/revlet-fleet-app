// app/api/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const ck = await cookies(); // ← async in Next 15

  const authenticated = Boolean(ck.get("sb-access-token") || ck.get("sb:token"));
  const email = ck.get("appEmail")?.value ?? null;
  const role = ck.get("appRole")?.value ?? null;
  const company_id = ck.get("appCompanyId")?.value ?? null;
  const linked = ck.get("appLinked")?.value === "1";

  return NextResponse.json({
    authenticated,
    email,
    role,
    company_id,
    customer_id: null,
    linked,
  });
}
