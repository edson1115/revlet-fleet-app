import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Role Security
  const role = user.user_metadata?.role;
  if (role !== "CUSTOMER" && role !== "SUPERADMIN") {
     redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans text-zinc-900">
      {/* EXECUTIVE TOP NAV */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
            
            {/* BRAND */}
            <div className="flex items-center gap-3">
                <div className="bg-black text-white text-xs font-black px-2 py-1 rounded italic tracking-tighter">REVLET</div>
                <span className="h-4 w-px bg-zinc-300"></span>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest hidden sm:block">Fleet Portal</span>
            </div>

            {/* LINKS (Restored!) */}
            <div className="hidden md:flex items-center gap-8">
                <Link href="/customer" className="text-sm font-bold text-zinc-600 hover:text-black transition">Dashboard</Link>
                <Link href="/customer/vehicles" className="text-sm font-bold text-zinc-600 hover:text-black transition">My Vehicles</Link>
                <Link href="/customer/tires" className="text-sm font-bold text-zinc-600 hover:text-black transition">Tire Orders</Link>
                <Link href="/customer/history" className="text-sm font-bold text-zinc-600 hover:text-black transition">History</Link>
            </div>

            {/* USER / SIGN OUT */}
            <div className="flex items-center gap-4">
                <div className="h-8 w-8 bg-zinc-100 text-zinc-600 rounded-full flex items-center justify-center text-xs font-black border border-zinc-200">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
                <form action="/auth/signout" method="post">
                    <button className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wide">
                        Sign Out
                    </button>
                </form>
            </div>
          </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}