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

  // 1. INITIALIZE SUPABASE (Standard SSR handles Vercel cookies automatically)
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

  // 2. SECURE USER CHECK (No manual token parsing needed)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // 3. FETCH PROFILE (Matches your SUPERADMIN role)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = (profile?.role || "").toUpperCase();
  
  // 4. LAUNCH ROLE LOGIC (Covers your 'SUPERADMIN' status)
  const isAdmin = ["SUPERADMIN", "SUPER_ADMIN", "ADMIN", "OFFICE", "DISPATCHER"].includes(userRole);

  if (!isAdmin) {
    // If you are logged in but not an admin, send to login to re-auth
    return redirect("/login");
  }

  // 5. RENDER
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