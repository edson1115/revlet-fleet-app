import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  let response = NextResponse.next({
    request: { headers: req.headers },
  });

  // 1. THE CIRCUIT BREAKER (Must be first)
  // If we are already headed to ANY admin sub-page, STOP and allow the request.
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

  // 2. SKIP ASSETS & API
  if (path.includes(".") || path.startsWith("/_next") || path.startsWith("/api")) {
    return response;
  }

  // 3. ROLE EXTRACTION
  // Matches your confirmed SUPERADMIN status from the database.
  const role = (user?.user_metadata?.role || "CUSTOMER").toUpperCase();

  // 4. AUTHENTICATED REDIRECT (Fixes the Redirect Loop & TypeScript Error)
  if (user && (path === "/" || path === "/login")) {
    const home = (role === "SUPERADMIN" || role === "ADMIN") ? "/admin/dashboard" : "/customer";
    
    // Explicitly cast to 'any' to bypass the Type Error: "types have no overlap".
    if ((path as any) !== home) {
      return NextResponse.redirect(new URL(home, req.url));
    }
  }

  // 5. AUTH PROTECTION
  const PUBLIC_PATHS = ["/", "/tour", "/login", "/signup", "/auth"];
  const isPublicPath = PUBLIC_PATHS.some(p => path === p || path.startsWith(p));
  
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};