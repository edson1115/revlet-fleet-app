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

  // --- 1. INITIALIZE SUPABASE ---
  // Standard SSR initialization that handles cookies automatically
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

  // --- 2. CHECK AUTH STATE ---
  // getUser() is the secure way to verify the user on the server
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // --- 3. FETCH PROFILE & ROLE ---
  // Your database shows 'SUPERADMIN' for edson.cortes@bigo.com
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = (profile?.role || "").toUpperCase();
  
  // --- 4. ALLOWED ADMIN ROLES ---
  // Explicitly included 'SUPERADMIN' to match your DB record
  const adminRoles = ["SUPERADMIN", "SUPER_ADMIN", "ADMIN", "OFFICE", "DISPATCHER"];
  const isAdmin = adminRoles.includes(userRole);
  const isTech = ["TECH", "TECHNICIAN"].includes(userRole);

  // --- 5. REDIRECT LOGIC ---
  if (!isAdmin) {
    if (isTech) return redirect("/tech");
    if (userRole === "SALES_REP") return redirect("/sales");
    return redirect("/login");
  }

  // --- 6. RENDER ---
  return (
    <div className="flex min-h-screen bg-black font-sans">
      <AdminSidebar />
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