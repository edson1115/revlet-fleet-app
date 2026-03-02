import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  let response = NextResponse.next({
    request: { headers: req.headers },
  });

  // 1. THE CIRCUIT BREAKER (Must stay at the very top)
  // If you are already in the admin dashboard, DO NOT redirect
  if (path.startsWith('/admin')) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 2. SKIP ASSETS
  if (path.includes(".") || path.startsWith("/_next") || path.startsWith("/api")) {
    return response;
  }

  // 3. ROLE EXTRACTION
  const role = (user?.user_metadata?.role || "CUSTOMER").toUpperCase();

  // 4. LOGIN REDIRECT (With path check to prevent loops)
  if (user && (path === "/" || path === "/login")) {
    const home = (role === "SUPERADMIN" || role === "ADMIN") ? "/admin/dashboard" : "/customer";
    if (path !== home) {
      return NextResponse.redirect(new URL(home, req.url));
    }
  }

  // 5. AUTH PROTECTION
  const PUBLIC_PATHS = ["/", "/tour", "/login", "/signup", "/auth"];
  if (!user && !PUBLIC_PATHS.some(p => path === p || path.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};