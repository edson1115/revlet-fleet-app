import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import RealtimePinger from "@/components/realtime/RealtimePinger"; // ✅ ADDED IMPORT

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

  // 4. CLEAN LAYOUT with Realtime Pinger
  return (
    <div className="min-h-screen bg-white">
       {/* ✅ LISTENER ADDED: Plays sound on new requests/updates */}
       <RealtimePinger role="OFFICE" />
       
       {children}
    </div>
  );
}