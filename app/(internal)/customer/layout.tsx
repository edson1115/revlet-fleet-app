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

  // ✅ FETCH CUSTOMER DETAILS (For Header)
  // We grab the company name attached to this user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id, customers(name, city, state)")
    .eq("id", user.id)
    .single();

  const companyName = profile?.customers?.name || "My Fleet";
  const branchLoc = profile?.customers?.city ? `${profile.customers.city}, ${profile.customers.state}` : "San Antonio, TX";

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans text-zinc-900 flex flex-col">
      
      {/* --- PREMIUM HEADER (Matches Office) --- */}
      <nav className="bg-white border-b border-zinc-200 sticky top-0 z-50 shadow-sm h-20 flex-shrink-0">
          <div className="max-w-[1920px] mx-auto px-8 h-full flex justify-between items-center">
            
            {/* LEFT: BRANDING */}
            <div className="flex items-center gap-6">
                {/* Logo (Identical to Office) */}
                <div className="text-xl font-black italic tracking-tighter flex items-center gap-2">
                    <span className="bg-black text-white px-2 py-0.5 rounded text-sm">R</span> REVLET
                </div>
                
                <div className="h-8 w-px bg-zinc-200 mx-2 hidden md:block"></div>

                {/* Company Info (Dynamic) */}
                <div className="hidden md:block">
                    <h1 className="text-sm font-black text-zinc-900 uppercase tracking-tight">
                        {companyName}
                    </h1>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        <span>{branchLoc}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300 mx-1"></span>
                        <span className="text-emerald-600">Portal Active</span>
                    </div>
                </div>
            </div>

            {/* RIGHT: NAVIGATION & USER */}
            <div className="flex items-center gap-8">
                {/* Nav Links (Restored) */}
                <div className="hidden md:flex items-center gap-6">
                    <Link href="/customer" className="text-xs font-bold text-zinc-600 hover:text-black uppercase tracking-wide transition">Dashboard</Link>
                    <Link href="/customer/vehicles" className="text-xs font-bold text-zinc-600 hover:text-black uppercase tracking-wide transition">My Vehicles</Link>
                    <Link href="/customer/tires" className="text-xs font-bold text-zinc-600 hover:text-black uppercase tracking-wide transition">Tire Orders</Link>
                    <Link href="/customer/history" className="text-xs font-bold text-zinc-600 hover:text-black uppercase tracking-wide transition">History</Link>
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-zinc-100 hidden md:block"></div>

                {/* User Chip */}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <div className="text-xs font-bold text-zinc-900">{user.email?.split('@')[0]}</div>
                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Fleet Manager</div>
                    </div>
                    
                    {/* Modern Avatar (Square, Dark) */}
                    <div className="w-9 h-9 bg-zinc-900 text-white rounded-lg flex items-center justify-center text-xs font-black shadow-lg shadow-zinc-200">
                        {user.email?.charAt(0).toUpperCase()}
                    </div>

                    {/* Sign Out */}
                    <form action="/auth/signout" method="post">
                        <button className="text-[10px] font-bold text-zinc-400 hover:text-red-600 uppercase tracking-widest ml-2">
                            Exit
                        </button>
                    </form>
                </div>
            </div>
          </div>
      </nav>

      {/* --- MAIN CONTENT WRAPPER --- */}
      {/* max-w-[1920px] and larger padding ensures 110% feel without zooming browser */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-8 py-8">
        {children}
      </main>
    </div>
  );
}