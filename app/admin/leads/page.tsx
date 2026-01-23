import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { resolveUserScope } from "@/lib/api/scope";
import LeadInboxClient from "./LeadInboxClient";

export const dynamic = "force-dynamic";

export default async function LeadInboxPage() {
  // 1. Security Check
  const scope = await resolveUserScope();
  if (!scope.isAdmin && !scope.isSuperadmin) redirect("/");

  // 2. Admin Client
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. FETCH PARALLEL DATA
  const [webLeadsRes, fieldLeadsRes] = await Promise.all([
    // A. New Web Leads
    adminClient
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false }),

    // B. Existing Field Sales Leads (Pending Onboarding)
    adminClient
      .from("sales_leads")
      .select("*")
      .in("customer_status", ["ONBOARDING"]) // Keep the filter you had
      .order("visit_date", { ascending: false })
  ]);

  return (
    <LeadInboxClient 
      initialWebLeads={webLeadsRes.data || []} 
      initialFieldLeads={fieldLeadsRes.data || []} 
    />
  );
}