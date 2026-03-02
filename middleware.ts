import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: req.headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;

  // 1. EXTRACT ROLE (Matches your confirmed SUPERADMIN status)
  const role = (user?.user_metadata?.role || "CUSTOMER").toUpperCase();

  // 2. AUTHENTICATED BYPASS (Loop Prevention)
  if (user && (path === "/login" || path === "/")) {
    const home = (role === "SUPERADMIN" || role === "ADMIN") ? "/admin/dashboard" : "/customer";
    
    // GUARD: Only redirect if you are NOT already at the destination
    if (path !== home) {
      return NextResponse.redirect(new URL(home, req.url));
    }
  }

  // 3. PUBLIC PATHS
  const isPublicPath = ["/", "/login", "/signup", "/auth"].some(p => path === p || path.startsWith(p));
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 4. ROLE-BASED PERMISSIONS
  const ROLE_ROUTES: Record<string, string[]> = {
    // Wildcard access for SUPERADMIN to ensure you are never blocked
    SUPERADMIN: ["/admin", "/office", "/dispatch", "/tech", "/customer", "/sales"],
    ADMIN:      ["/admin", "/office", "/dispatch", "/sales"],
    CUSTOMER:   ["/customer"],
    TECH:       ["/tech"],
  };

  const PROTECTED_PREFIXES = ["/admin", "/office", "/dispatch", "/tech", "/customer", "/sales"];
  const isProtectedPath = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (isProtectedPath && user) {
    const isAllowed = ROLE_ROUTES[role]?.some((prefix) => path.startsWith(prefix));
    
    if (!isAllowed) {
      const fallback = (role === "SUPERADMIN" || role === "ADMIN") ? "/admin/dashboard" : "/login";
      
      // GUARD: Prevent recursive fallbacks
      if (path !== fallback) {
        return NextResponse.redirect(new URL(fallback, req.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};