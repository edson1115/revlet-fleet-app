import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  let response = NextResponse.next({
    request: { headers: req.headers },
  });

  const path = req.nextUrl.pathname;

  // 1. THE ULTIMATE CIRCUIT BREAKER (Must be first)
  // If we are already in the admin section, STOP everything immediately.
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

  // 2. Skip assets
  if (path.includes(".") || path.startsWith("/_next") || path.startsWith("/api")) {
    return response;
  }

  // 3. Login/Home Redirect
  if (user && (path === "/" || path === "/login")) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // 4. Auth Protection
  const PUBLIC_PATHS = ["/", "/tour", "/login", "/signup", "/auth"];
  if (!user && !PUBLIC_PATHS.some(p => path === p || path.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};