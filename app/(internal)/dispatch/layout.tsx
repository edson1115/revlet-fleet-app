import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DispatchSidebar from "./DispatchSidebar";

export default async function DispatchLayout({ children }: { children: React.ReactNode }) {
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

  // 3. Strict Access Control (Allows DISPATCHER)
  if (finalRole !== "DISPATCH" && finalRole !== "DISPATCHER" && finalRole !== "ADMIN" && finalRole !== "OFFICE") {
    redirect("/login");
  }

  return (
    <div className="bg-[#f8f9fa] min-h-screen flex flex-row font-sans">
      <DispatchSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
}