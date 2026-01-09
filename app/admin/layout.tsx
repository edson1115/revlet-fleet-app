import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminSidebar from "@/app/components/admin/AdminSidebar";
import { ToastProvider } from "@/components/Toaster"; 

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  // --- 1. MANUAL TOKEN PARSING ---
  // Ensures compatibility with local development session storage
  let accessToken = null;
  const allCookies = cookieStore.getAll();
  const authCookie = allCookies.find(c => 
    c.name.includes("sb-revlet-auth-token") || c.name.includes("-auth-token")
  );

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
      // Silently fail parsing
    }
  }

  // --- 2. INITIALIZE SUPABASE ---
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

  // --- 3. CHECK USER ---
  let user = null;
  if (accessToken) {
    const { data } = await supabase.auth.getUser(accessToken);
    user = data.user;
  }

  if (!user) redirect("/login");

  // --- 4. CHECK ROLE ---
  // We use the anon key with the existing cookie store to verify the profile
  const roleCheckClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  );

  const { data: profile } = await roleCheckClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = (profile?.role || "").toUpperCase();
  
  // Define access logic
  const isAdmin = ["SUPER_ADMIN", "SUPERADMIN", "ADMIN", "OFFICE", "DISPATCHER"].includes(userRole);
  const isTech = ["TECH", "TECHNICIAN"].includes(userRole);

  // 🚪 REDIRECT LOGIC
  // If the user is NOT an Admin, determine where they belong
  if (!isAdmin) {
      if (isTech) {
          // Redirect to the tech root where app/tech/page.tsx handles the dashboard
          return redirect("/tech"); 
      }
      if (userRole === "SALES_REP") return redirect("/sales");
      
      // Default fallback for customers or unauthorized access
      return redirect("/login");
  }

  // --- 5. RENDER PREMIUM LAYOUT ---
  return (
    <div className="flex min-h-screen bg-black font-sans">
      {/* Persistent Sidebar for Admin users */}
      <AdminSidebar />
      
      {/* Wrap content in ToastProvider to support notifications in tech management, etc. */}
      <ToastProvider>
        <main className="flex-1 overflow-y-auto bg-white md:rounded-l-[3rem] md:my-2 shadow-2xl relative">
          <div className="p-4 md:p-8">
              {children}
          </div>
        </main>
      </ToastProvider>
    </div>
  );
}