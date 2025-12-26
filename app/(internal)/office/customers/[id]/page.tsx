import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import OfficeCustomerFleetClient from "./OfficeCustomerFleetClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfficeCustomerDetailPage({ params }: PageProps) {
  // 1. Await Params (Next.js 15)
  const { id } = await params;
  
  const supabase = await supabaseServer();

  // 2. Fetch Customer
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (!customer) notFound();

  // 3. Fetch Vehicles
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("customer_id", customer.id)
    .order("unit_number", { ascending: true });

  // 4. Pass Data to Client Component
  return (
    <OfficeCustomerFleetClient 
      customer={customer} 
      vehicles={vehicles || []} 
    />
  );
}