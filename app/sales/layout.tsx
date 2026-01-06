import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SalesNavBar from "./SalesNavBar";

export default async function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  // --- MANUAL TOKEN PARSING ---
  let accessToken = null;
  const allCookies = cookieStore.getAll();
  const authCookie = allCookies.find(c => c.name.includes("-auth-token"));

  if (authCookie) {
    try {
      let rawValue = authCookie.value;
      if (rawValue.startsWith("base64-")) {
        rawValue = rawValue.replace("base64-", "");
        rawValue = Buffer.from(rawValue, 'base64').toString('utf-8');
      }
      rawValue = decodeURIComponent(rawValue);
      const sessionData = JSON.parse(rawValue);
      accessToken = sessionData.access_token;
    } catch (e) {}
  }

  // 1. Initialize Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  );

  // 2. Check User
  let user = null;
  if (accessToken) {
    const { data } = await supabase.auth.getUser(accessToken);
    user = data.user;
  }

  if (!user) redirect("/login");

  // 3. Check Role (Admin Client for safety)
  const adminSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  );

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const allowedRoles = ["SALES_REP", "ADMIN", "SUPER_ADMIN", "OFFICE"];
  
  if (!profile || !allowedRoles.includes(profile.role)) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl">⛔</h1>
          <h2 className="font-bold text-xl mt-4">Sales Access Only</h2>
          <p className="text-gray-500 mt-2">Your role ({profile?.role}) cannot view this page.</p>
          <a href="/login" className="mt-6 inline-block text-blue-600 hover:underline">Return to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SalesNavBar userEmail={user.email || ""} />
      <main className="max-w-6xl mx-auto p-8">
        {children}
      </main>
    </div>
  );
}