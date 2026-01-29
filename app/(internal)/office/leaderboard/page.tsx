import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import LeaderboardClient from "./LeaderboardClient"; 

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await supabaseServerReadonly();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch XP Stats + Profile Role to allow filtering
  const { data: rawData, error } = await supabase
    .from("user_xp_stats")
    .select(`
      id,
      user_id,
      total_xp,
      current_level,
      current_streak,
      profiles:user_id (full_name, email, role)
    `)
    .order("total_xp", { ascending: false });

  if (error) console.error("Leaderboard Error:", error);

  // Clean data structure
  const allPlayers = (rawData || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    xp: row.total_xp,
    level: row.current_level,
    streak: row.current_streak,
    name: row.profiles?.full_name || "Unknown",
    role: row.profiles?.role || "TECH", 
  }));

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans text-zinc-900">
      
      {/* HEADER */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 px-8 h-20 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-4">
            <Link href="/office" className="bg-zinc-100 p-2 rounded-lg hover:bg-zinc-200 transition text-zinc-500">
                ←
            </Link>
            <div>
                <h1 className="text-xl font-black text-zinc-900 tracking-tight">Performance Rankings</h1>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Market Stats</p>
            </div>
         </div>
      </header>

      {/* Pass Data to Client Wrapper for Toggling */}
      <LeaderboardClient initialPlayers={allPlayers} />

    </div>
  );
}