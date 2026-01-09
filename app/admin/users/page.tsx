import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import UserManagementClient from "./UserManagementClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ market?: string; role?: string; state?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const params = await searchParams;
  
  // 1. SESSION PARSING
  let userId = null;
  const authCookie = allCookies.find(c => c.name.includes("-auth-token"));

  if (authCookie) {
    try {
      let rawValue = authCookie.value;
      if (rawValue.startsWith("base64-")) {
        rawValue = Buffer.from(rawValue.replace("base64-", ""), 'base64').toString('utf-8');
      }
      rawValue = decodeURIComponent(rawValue);
      const sessionData = JSON.parse(rawValue);
      userId = sessionData.user?.id; 
    } catch (e) {
      console.error("Critical Session Parse Error:", e);
    }
  }

  if (!userId) redirect("/login");

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 2. BUILD DYNAMIC QUERY
  // We filter by market and role at the database level to handle scale.
  let profilesQuery = adminClient.from("profiles").select("*");
  
  if (params.market) {
    profilesQuery = profilesQuery.eq("active_market", params.market);
  } else {
    // Default to San Antonio for your current testing
    profilesQuery = profilesQuery.eq("active_market", "San Antonio");
  }

  if (params.role && params.role !== "ALL") {
    profilesQuery = profilesQuery.eq("role", params.role.toUpperCase());
  }

  // 3. FETCH DATA IN PARALLEL
  const [profilesRes, customersRes, authUsersRes] = await Promise.all([
    profilesQuery.order("full_name", { ascending: true }),
    adminClient.from("customers").select("id, company_name"),
    adminClient.auth.admin.listUsers()
  ]);

  const profiles = profilesRes.data || [];
  const customers = customersRes.data || [];
  const authUsers = authUsersRes.data?.users || [];

  // 4. PERMISSION CHECK
  // We fetch the current user's profile from the full database to check admin status
  const { data: currentUserProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const currentRole = (currentUserProfile?.role || "").toUpperCase();
  const isAuthorized = ["SUPER_ADMIN", "SUPERADMIN", "ADMIN"].includes(currentRole);

  if (!isAuthorized) {
    redirect("/office");
  }

  // 5. MAP AUTH USERS TO FILTERED DATABASE PROFILES
  // Only display users that match the current Market/Role selection.
  const formattedUsers = profiles.map(dbProfile => {
    const authUser = authUsers.find(u => u.id === dbProfile.id);
    return {
      id: dbProfile.id,
      email: dbProfile.email || authUser?.email,
      full_name: dbProfile.full_name || "New User",
      role: dbProfile.role || "CUSTOMER",
      customer_id: dbProfile.customer_id || null,
      created_at: dbProfile.created_at,
      active_market: dbProfile.active_market
    };
  });

  // Extract unique markets for the UI filter buttons
  // In the future, this could be a dedicated 'markets' table.
  const availableMarkets = ["San Antonio", "Austin", "Houston", "Dallas"];

  return (
    <UserManagementClient 
      users={formattedUsers} 
      customers={customers} 
      currentMarket={params.market || "San Antonio"}
      currentRole={params.role || "ALL"}
      availableMarkets={availableMarkets}
    />
  );
}