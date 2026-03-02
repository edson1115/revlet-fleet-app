import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  let response = NextResponse.next({
    request: { headers: req.headers },
  });

  const path = req.nextUrl.pathname;

  // 1. CIRCUIT BREAKER
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

  // 2. EXTRACT ROLE
  const role = (user?.user_metadata?.role || "CUSTOMER").toUpperCase();

  // 3. AUTHENTICATED BYPASS (Fixed for TypeScript)
  if (user && (path === "/login" || path === "/")) {
    const home = (role === "SUPERADMIN" || role === "ADMIN") ? "/admin/dashboard" : "/customer";
    
    // Use a string cast to satisfy the TypeScript compiler
    if ((path as string) !== home) {
      return NextResponse.redirect(new URL(home, req.url));
    }
    return response;
  }

  // 4. PUBLIC PATHS
  const PUBLIC_PATHS = ["/", "/tour", "/login", "/signup", "/auth"];
  const isPublicPath = PUBLIC_PATHS.some(p => path === p || path.startsWith(p));
  
  if (!user && !isPublicPath && !path.includes(".")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 5. ROLE-BASED PERMISSIONS
  const ROLE_ROUTES: Record<string, string[]> = {
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
      if ((path as string) !== fallback) {
        return NextResponse.redirect(new URL(fallback, req.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};