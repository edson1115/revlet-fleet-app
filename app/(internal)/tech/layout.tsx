import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

// --- ICONS ---
const IconList = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const IconHistory = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconChart = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;

export default async function TechLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { } },
      },
    }
  );

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Role Security (Only Techs & Admins)
  const role = user.user_metadata?.role;
  if (role !== "TECH" && role !== "TECHNICIAN" && role !== "ADMIN" && role !== "SUPERADMIN") {
     redirect("/login");
  }

  return (
    <div className="bg-black min-h-screen font-sans text-white">
      {/* Page Content (Dashboard, Detail, History, etc.) */}
      {children}
      
      {/* BOTTOM TAB BAR (Sticky Footer) */}
      <div className="fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-zinc-800 h-20 flex justify-around items-center z-50 pb-2 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
         
         <Link href="/tech" className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition group">
            <div className="group-hover:-translate-y-1 transition-transform duration-200">
               <IconList />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Run</span>
         </Link>
         
         <Link href="/tech/history" className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition group">
            <div className="group-hover:-translate-y-1 transition-transform duration-200">
               <IconHistory />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
         </Link>

         <Link href="/tech/analytics" className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition group">
            <div className="group-hover:-translate-y-1 transition-transform duration-200">
               <IconChart />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Stats</span>
         </Link>

      </div>
    </div>
  );
}