// app/api/auth/dev-login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// This is ONLY for local dev convenience.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") || "demo@revlet.test";
  const role = url.searchParams.get("role") || "ADMIN"; // ADMIN | OFFICE | DISPATCH | TECH | CUSTOMER
  const company_id = "00000000-0000-0000-0000-000000000002";
  const next = url.searchParams.get("next") || "/";

  const ck = await cookies(); // ← await in Next 15
  const maxAge = 60 * 60 * 8;

  ck.set("appEmail", email, { httpOnly: false, sameSite: "lax", path: "/", maxAge });
  ck.set("appRole", role, { httpOnly: false, sameSite: "lax", path: "/", maxAge });
  ck.set("appCompanyId", company_id, { httpOnly: false, sameSite: "lax", path: "/", maxAge });
  ck.set("appLinked", "1", { httpOnly: false, sameSite: "lax", path: "/", maxAge });

  return NextResponse.redirect(new URL(next, url.origin));
}



