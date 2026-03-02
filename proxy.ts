import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  let response = NextResponse.next({
    request: { headers: req.headers },
  });

  // 1. THE HARD CIRCUIT BREAKER
  // If the user is already on an admin page, STOP immediately and let it load.
  // This prevents the infinite redirect loop.
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

  // 2. SKIP STATIC ASSETS
  if (path.includes(".") || path.startsWith("/_next") || path.startsWith("/api")) {
    return response;
  }

  // 3. ROLE-BASED REDIRECT
  const role = (user?.user_metadata?.role || "CUSTOMER").toUpperCase();

  if (user && (path === "/" || path === "/login")) {
    const home = (role === "SUPERADMIN" || role === "ADMIN") ? "/admin/dashboard" : "/customer";
    
    // Type-cast to any to satisfy the Vercel build compiler
    if ((path as any) !== home) {
      return NextResponse.redirect(new URL(home, req.url));
    }
  }

  // 4. AUTH PROTECTION
  const PUBLIC_PATHS = ["/", "/tour", "/login", "/signup", "/auth"];
  if (!user && !PUBLIC_PATHS.some(p => path === p || path.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};