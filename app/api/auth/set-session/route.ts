// app/api/auth/set-session/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function normalizeRole(input?: string | null) {
  const r = (input ?? "").trim().toUpperCase();
  if (!r) return undefined;

  // normalize common variants
  if (r === "SUPER_ADMIN") return "SUPERADMIN";
  if (r === "DISPATCHER") return "DISPATCH";
  if (r === "TECHNICIAN") return "TECH";
  if (r === "CUSTOMER_USER") return "CUSTOMER";

  return r;
}

function roleToRedirect(role?: string) {
  // IMPORTANT: if role is missing, do NOT send them to a protected route (causes loops)
  if (!role) return "/no-access";

  switch (role) {
    case "SUPERADMIN":
    case "ADMIN":
      return "/admin/dashboard"; // safer than "/admin" (avoids extra redirects)
    case "OFFICE":
      return "/office";
    case "DISPATCH":
      return "/dispatch";
    case "TECH":
      return "/tech";
    case "CUSTOMER":
      // Your app has both /customer and /portal; pick the one you intend after login.
      // If you want customer users to land on /customer, change this to "/customer".
      return "/portal";
    case "SALES":
    case "SALES_REP":
      return "/sales";
    default:
      return "/no-access";
  }
}

export async function POST(req: Request) {
  try {
    const { access_token, refresh_token } = await req.json();

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
    }

    const cookieStore = await cookies();

    // ✅ Use modern getAll/setAll pattern (matches your ensure-profile route)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // ignore if called from a server component context
            }
          },
        },
      }
    );

    // 🔥 This creates a real session + sets auth cookies
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error || !data.user) {
      console.error("[Set-Session] setSession failed:", error);
      return NextResponse.json({ error: "Auth failed" }, { status: 401 });
    }

    // 1) Role from user metadata (if you set it on Auth users)
    const metaRole = normalizeRole(data.user.user_metadata?.role);

    // 2) Role from profiles table (if present)
    let profileRole: string | undefined;
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileErr) {
      console.error("[Set-Session] profiles lookup error:", profileErr);
    }

    profileRole = normalizeRole((profile as any)?.role);

    // 3) If profile missing, create one (minimal) so role can exist going forward
    //    We will NOT guess admin roles here. If metadata role exists, we store it.
    if (!profile) {
      const roleToPersist = metaRole ?? null;

      const { error: insertErr } = await supabase.from("profiles").insert([
        {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name ?? null,
          role: roleToPersist, // may be null; we won't guess
          customer_id: null,
          active: true,
        },
      ]);

      if (insertErr) {
        // If RLS blocks insert, we still proceed — but we won't have a role.
        console.error("[Set-Session] profile insert error:", insertErr);
      } else {
        profileRole = roleToPersist ? normalizeRole(roleToPersist) : undefined;
      }
    }

    // Final role decision (profile wins if present, else metadata)
    const role = profileRole ?? metaRole;

    // Logging for your debugging
    console.log(`[Set-Session] User: ${data.user.email} | Role: ${role ?? "MISSING"}`);

    const redirectUrl = roleToRedirect(role);

    return NextResponse.json({ success: true, redirectUrl, role: role ?? null });
  } catch (err: any) {
    console.error("[Set-Session] fatal error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}