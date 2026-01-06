import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import UserManagementClient from "./UserManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  // 1. Manually Await Cookies
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  // 2. Extract Token
  let accessToken = null;
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
      console.error("Cookie Parse Error:", e);
    }
  }

  if (!accessToken) redirect("/login");

  // 3. Verify User Identity (Standard Client)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !user) redirect("/login");

  // 4. CHECK ROLE (Using SERVICE KEY to bypass RLS)
  // This is the fix. We force the server to tell us the role, ignoring policies.
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // 5. DEBUGGING (Optional: Remove later)
  // If this still fails, you'll see exactly what the database thinks you are.
  console.log(`User: ${user.email}, Role: ${profile?.role}`);

  // 6. Strict Gatekeeping
  if (!profile || (profile.role !== "SUPER_ADMIN" && profile.role !== "ADMIN")) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h1 className="text-4xl mb-4">⛔</h1>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-500 mb-6">
                  You are logged in as <strong>{user.email}</strong>,<br/>
                  but your role is <strong>{profile?.role || "Unknown"}</strong>.
                </p>
                <a href="/login" className="px-6 py-2 bg-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-300">
                  Switch Account
                </a>
            </div>
        </div>
    );
  }

  // 7. Fetch All Users (Admin Mode)
  const { data: allUsers } = await adminClient
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return <UserManagementClient users={allUsers || []} />;
}