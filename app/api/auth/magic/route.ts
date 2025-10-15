// app/api/auth/magic/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// TODO: replace this with your real Supabase verification + linking
async function linkUserAndResolveProfile(_req: Request) {
  // 1) Verify access_token/refresh_token from body
  // 2) Upsert/link app_users by email (idempotent)
  // 3) Return email, role, company_id for cookie priming
  return {
    email: "example@revlet.test",
    role: "ADMIN",
    company_id: "00000000-0000-0000-0000-000000000002",
  };
}

export async function POST(req: Request) {
  // Perform your Supabase validation + linking
  const { email, role, company_id } = await linkUserAndResolveProfile(req);

  // In Next 15, cookies() is async. Await it BEFORE using .set(...)
  const ck = await cookies();
  const maxAge = 60 * 60 * 8; // 8 hours

  ck.set("appEmail", email, { httpOnly: false, sameSite: "lax", path: "/", maxAge });
  ck.set("appRole", role, { httpOnly: false, sameSite: "lax", path: "/", maxAge });
  ck.set("appCompanyId", company_id, { httpOnly: false, sameSite: "lax", path: "/", maxAge });
  ck.set("appLinked", "1", { httpOnly: false, sameSite: "lax", path: "/", maxAge });

  // Optional: honor ?next=
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/";
  return NextResponse.redirect(new URL(next, url.origin));
}
