import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminNavBar from "./AdminNavBar"; 

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  // --- MANUAL TOKEN PARSING (The Fix) ---
  // We manually extract the token because standard helpers sometimes fail locally
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
    } catch (e) {
      // console.error("Layout Cookie Parse Error:", e);
    }
  }
  // ---------------------------------------

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

  // 2. Check User (Using the manually found token)
  let user = null;
  if (accessToken) {
    const { data } = await supabase.auth.getUser(accessToken);
    user = data.user;
  }

  if (!user) redirect("/login");

  // 3. Check Role (Using Service Key to ensure we can read it)
  // We use a fresh admin client to bypass RLS for this role check
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

  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "OFFICE"];
  
  if (!profile || !allowedRoles.includes(profile.role)) {
     if (profile?.role === "SALES_REP") redirect("/sales");
     return redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavBar userEmail={user.email || ""} />
      <main>
        {children}
      </main>
    </div>
  );
}