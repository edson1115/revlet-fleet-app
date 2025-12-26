import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
// We will reuse your existing Create Client (assuming it exists)
// If you named it differently, let me know. 
// Based on previous contexts, it might be named `OfficeCreateRequestClient` or similar.
import OfficeCreateRequestClient from "./OfficeCreateRequestClient";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OfficeNewRequestPage({ searchParams }: PageProps) {
  // 1. Await Search Params (Next.js 15 Fix)
  const params = await searchParams;
  const customerId = typeof params.customer_id === "string" ? params.customer_id : null;

  const scope = await resolveUserScope();
  if (!scope.uid) redirect("/login");

  const supabase = await supabaseServer();

  // 2. If we have a customer ID, fetch their details to prepopulate
  let preselectedCustomer = null;

  if (customerId) {
    const { data } = await supabase
      .from("customers")
      .select("id, name, market")
      .eq("id", customerId)
      .single();
    
    preselectedCustomer = data;
  }

  // 3. Pass data to the Client Form
  return (
    <OfficeCreateRequestClient 
      preselectedCustomer={preselectedCustomer}
    />
  );
}