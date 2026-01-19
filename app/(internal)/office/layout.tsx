import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
// import AppLayout from "@/components/layout/AppLayout"; // 👈 REMOVING THE BLOCKER

export default async function OfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // 1. Check User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Check Role
  const metaRole = user.user_metadata?.role;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const finalRole = profile?.role || metaRole;

  // 3. ALLOW "DISPATCHER" (Matches your DB)
  if (finalRole !== "OFFICE" && finalRole !== "ADMIN" && finalRole !== "DISPATCH" && finalRole !== "DISPATCHER") {
    redirect("/login");
  }

  // 4. BYPASS APPLAYOUT (The Client-Side Killer)
  // We return a simple div wrapper instead of AppLayout to stop the redirect loop.
  return (
    <div className="min-h-screen bg-white">
       {/* Temporary Navigation Header so you can escape to Dispatch */}
       <div className="bg-black text-white p-4 flex justify-between items-center">
          <span className="font-bold">REVLET OFFICE (Safe Mode)</span>
          <a href="/dispatch" className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-zinc-200">
             GO TO DISPATCH CONSOLE &rarr;
          </a>
       </div>
       {children}
    </div>
  );
}