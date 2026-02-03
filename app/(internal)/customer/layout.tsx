import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import RealtimePinger from "@/components/realtime/RealtimePinger"; 

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

  // ✅ 1. TRY METADATA FIRST
  let customerId = user.user_metadata?.customer_id;

  // ✅ 2. TRY DATABASE PROFILE
  let companyName = "My Fleet";
  let branchLoc = "San Antonio, TX"; // Default since DB columns are missing

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("customer_id, customers(name)") // 👈 FIXED: Removed 'city' and 'state' to prevent crash
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("❌ [CustomerLayout] DB Error:", error.message);
  }

  if (profile) {
      if (!customerId) customerId = profile.customer_id;
      // Fix: Handle cases where customers is an array or a single object
const custData = Array.isArray(profile.customers) ? profile.customers[0] : profile.customers;
if (custData?.name) companyName = custData.name;
      // We removed dynamic city/state because columns don't exist
  }

  console.log(`[CustomerLayout] User: ${user.email}`);
  console.log(`[CustomerLayout] Found Customer ID:`, customerId);

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans text-zinc-900 flex flex-col">
      
      {/* ✅ PING SYSTEM */}
      <RealtimePinger role="CUSTOMER" userId={customerId} />

      {/* --- HEADER --- */}
      <nav className="bg-white border-b border-zinc-200 sticky top-0 z-50 shadow-sm h-20 flex-shrink-0">
          <div className="max-w-[1920px] mx-auto px-8 h-full flex justify-between items-center">
            
            {/* LEFT: BRANDING */}
            <div className="flex items-center gap-6">
                <div className="text-xl font-black italic tracking-tighter flex items-center gap-2">
                    <span className="bg-black text-white px-2 py-0.5 rounded text-sm">R</span> REVLET
                </div>
                
                <div className="h-8 w-px bg-zinc-200 mx-2 hidden md:block"></div>

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
                <div className="hidden md:flex items-center gap-6">
                    <Link href="/customer" className="text-xs font-bold text-zinc-600 hover:text-black uppercase tracking-wide transition">Dashboard</Link>
                    <Link href="/customer/vehicles" className="text-xs font-bold text-zinc-600 hover:text-black uppercase tracking-wide transition">My Vehicles</Link>
                    <Link href="/customer/tires" className="text-xs font-bold text-zinc-600 hover:text-black uppercase tracking-wide transition">Tire Orders</Link>
                    <Link href="/customer/history" className="text-xs font-bold text-zinc-600 hover:text-black uppercase tracking-wide transition">History</Link>
                </div>

                <div className="h-8 w-px bg-zinc-100 hidden md:block"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <div className="text-xs font-bold text-zinc-900">{user.email?.split('@')[0]}</div>
                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Fleet Manager</div>
                    </div>
                    
                    <div className="w-9 h-9 bg-zinc-900 text-white rounded-lg flex items-center justify-center text-xs font-black shadow-lg shadow-zinc-200">
                        {user.email?.charAt(0).toUpperCase()}
                    </div>

                    <form action="/auth/signout" method="post">
                        <button className="text-[10px] font-bold text-zinc-400 hover:text-red-600 uppercase tracking-widest ml-2">
                            Exit
                        </button>
                    </form>
                </div>
            </div>
          </div>
      </nav>

      <main className="flex-1 w-full max-w-[1920px] mx-auto px-8 py-8">
        {children}
      </main>
    </div>
  );
}