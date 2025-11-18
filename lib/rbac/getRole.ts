import { supabaseServer } from "@/lib/supabase/server";

export async function getUserRole() {
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.user_metadata?.role || "OFFICE";
}
