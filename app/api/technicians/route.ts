// app/api/technicians/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServerRoute } from "@/lib/supabase/server-route";

export const dynamic = "force-dynamic";

function isAllowedRole(role?: string) {
  return (
    role === "SUPERADMIN" ||
    role === "ADMIN" ||
    role === "DISPATCH" ||
    role === "DISPATCHER" ||
    role === "OFFICE"
  );
}

export async function GET(req: Request) {
  try {
    // ✅ Auth check using SSR client (handles chunked cookies)
    const supabaseAuth = await supabaseServerRoute();
    const {
      data: { user },
      error: userErr,
    } = await supabaseAuth.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const role = (user.user_metadata?.role as string | undefined) ?? undefined;
    if (!isAllowedRole(role)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Optional filter: /api/technicians?active=1
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get("active") === "1";

    // ✅ Service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1) Pull techs from profiles (NO phone, NO market)
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, market_id, is_active, active")
      .eq("role", "TECH")
      .order("full_name", { ascending: true });

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    const list = profiles ?? [];

    // 2) Pull phones from auth.users via Admin API (SMS/phone support)
    const { data: authList, error: authErr } =
      await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });

    // If admin list fails, do NOT fail the whole endpoint—return techs without phone
    if (authErr) {
      console.error("Technicians API Error (auth.admin.listUsers):", authErr);

      const fallback = activeOnly
        ? list.filter((t: any) => (t.is_active ?? t.active ?? true) !== false)
        : list;

      return NextResponse.json(
        fallback.map((t: any) => ({
          id: t.id,
          full_name: t.full_name ?? null,
          email: t.email ?? null,
          phone: null,
          role: "TECH",
          market_id: t.market_id ?? null,
          is_active: (t.is_active ?? t.active ?? true) !== false,
        }))
      );
    }

    const users = authList?.users ?? [];
    const authById = new Map(users.map((u: any) => [u.id, u]));

    // 3) Normalize output
    const techs = list
      .map((t: any) => {
        const au = authById.get(t.id);

        const phone = au?.phone ?? au?.user_metadata?.phone ?? null;
        const is_active = (t.is_active ?? t.active ?? true) !== false;

        return {
          id: t.id,
          full_name: t.full_name ?? null,
          email: t.email ?? null,
          phone,
          role: "TECH",
          market_id: t.market_id ?? null,
          is_active,
        };
      })
      .filter((t: any) => (activeOnly ? t.is_active : true));

    return NextResponse.json(techs);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "failed" },
      { status: 500 }
    );
  }
}