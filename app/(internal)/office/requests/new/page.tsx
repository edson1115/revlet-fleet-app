import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
// import { resolveUserScope } from "@/lib/api/scope"; // <-- REMOVE THIS STRICT CHECK
import OfficeNewRequestForm from "./OfficeNewRequestForm";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OfficeNewRequestPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const customerId = typeof params.customer_id === "string" ? params.customer_id : null;

  // 1. Use Standard Server Auth (More reliable)
  const supabase = await supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.log("❌ [New Request] No user found, redirecting to login");
    redirect("/login");
  }

  // 2. Fetch Preselected Customer (if any)
  let preselectedCustomer = null;
  if (customerId) {
    const { data } = await supabase
      .from("customers")
      .select("id, name, market")
      .eq("id", customerId)
      .single();
    preselectedCustomer = data;
  }

  // 3. Render Form
  return (
    <OfficeNewRequestForm 
      preselectedCustomer={preselectedCustomer}
    />
  );
}