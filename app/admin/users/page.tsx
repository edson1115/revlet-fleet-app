import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { resolveUserScope } from "@/lib/api/scope";
import UserManagementClient from "./UserManagementClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ market?: string; role?: string; state?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // 1. STABLE SESSION CHECK
  const scope = await resolveUserScope();
  if (!scope.uid) redirect("/login");

  // 2. CHECK PERMISSIONS
  if (!scope.isSuperadmin && !scope.isAdmin) {
    redirect("/");
  }

  // 3. ADMIN CLIENT (Bypass RLS)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 4. FETCH DATA IN PARALLEL
  // We fetch ALL profiles and ALL auth users to merge them in memory.
  const [profilesRes, customersRes, authUsersRes] = await Promise.all([
    adminClient.from("profiles").select("*"),
    adminClient.from("customers").select("id, company_name"),
    adminClient.auth.admin.listUsers({ perPage: 1000 }) // Ensure we catch everyone
  ]);

  const profiles = profilesRes.data || [];
  const customers = customersRes.data || [];
  const authUsers = authUsersRes.data?.users || [];

  // 5. MAP DATA (Source of Truth = AUTH USERS)
  // This ensures "Invisible Users" (Invited but never logged in) still show up.
  const formattedUsers = authUsers.map(authUser => {
    // Try to find a matching DB profile (Active users will have one)
    const dbProfile = profiles.find(p => p.id === authUser.id);
    const meta = authUser.user_metadata || {}; 
    
    return {
      id: authUser.id,
      email: authUser.email,
      // Name Priority: Profile -> Metadata -> Email Stub -> Fallback
      name: dbProfile?.full_name || meta.full_name || authUser.email?.split('@')[0] || "Invited User",
      role: dbProfile?.role || meta.role || "CUSTOMER",
      customer_id: dbProfile?.customer_id || meta.company_id || null,
      created_at: authUser.created_at,
      active_market: dbProfile?.active_market || "Unassigned",
      
      // Contact Info (Fallback to metadata for pending users)
      phone: dbProfile?.phone || meta.phone || "N/A",
      company_name: dbProfile?.company_name || meta.company_name || null,
      fleet_size: dbProfile?.fleet_size || meta.fleet_size || null,
      
      status: "ACTIVE", // Client component handles "Pending" visual based on login date
      active: true,

      // Auth Status (The Critical Part for detection)
      last_sign_in_at: authUser.last_sign_in_at || null,
      email_confirmed_at: authUser.email_confirmed_at || null,
      // Note: 'encrypted_password' is not always exposed, relying on last_sign_in_at is safer for "Pending" status
      has_password: !!authUser.email_confirmed_at 
    };
  });

  // 6. OPTIONAL FILTERING
  // If a specific market is requested via URL, filter the list now.
  const filteredUsers = (params.market && params.market !== "ALL")
    ? formattedUsers.filter(u => u.active_market === params.market)
    : formattedUsers;

  return (
    <UserManagementClient 
      users={filteredUsers} 
      customers={customers} 
      currentMarket={params.market || "ALL"}
      currentRole={params.role || "ALL"}
    />
  );
}