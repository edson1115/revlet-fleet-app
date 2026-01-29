"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function grantManualXp(targetUserId: string, amount: number, reason: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  );

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // 2. Permission Check (Must be Office/Admin)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!['OFFICE', 'SUPERADMIN', 'SALES'].includes(profile?.role || '')) {
      return { error: "Permission Denied: Only Managers can grant XP." };
  }

  // 3. Award XP Logic
  // A. Update Stats
  const { error: statsError } = await supabase.rpc('increment_xp', { 
      target_user_id: targetUserId, 
      xp_amount: amount 
  });

  // Note: We can also just run the direct update if you didn't make an RPC, 
  // but let's do the direct update pattern we used in the trigger to be safe via SQL query
  // Actually, simplest is to insert into history and let the DB trigger handle it? 
  // No, the trigger only watches 'service_requests'. We need to manually update.

  const { data: currentStats } = await supabase
    .from("user_xp_stats")
    .select("total_xp")
    .eq("user_id", targetUserId)
    .single();
    
  const newTotal = (currentStats?.total_xp || 0) + amount;
  
  // Calculate Rank
  let newLevel = 'ROOKIE';
  if (newTotal > 25000) newLevel = 'MASTER';
  else if (newTotal > 10000) newLevel = 'ELITE';
  else if (newTotal > 5000) newLevel = 'GOLD';
  else if (newTotal > 2500) newLevel = 'SILVER';
  else if (newTotal > 1000) newLevel = 'BRONZE';

  // Update Table
  await supabase
    .from("user_xp_stats")
    .update({ 
        total_xp: newTotal,
        current_level: newLevel 
    })
    .eq("user_id", targetUserId);

  // 4. Log History
  const { error: historyError } = await supabase
    .from("xp_history")
    .insert({
        user_id: targetUserId,
        action_type: amount > 0 ? 'MANAGER_BONUS' : 'MANAGER_PENALTY',
        points_earned: amount,
        description: reason // e.g. "Clean Van Bonus"
    });

  if (historyError) return { error: historyError.message };

  revalidatePath("/office/leaderboard");
  return { success: true };
}