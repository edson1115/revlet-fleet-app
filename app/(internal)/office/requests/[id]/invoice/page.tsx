import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import InvoiceEditor from "./InvoiceEditor"; 

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  );

  const { id } = await params;

  // ✅ FIXED QUERY: Connects directly to 'customers' table
  const { data: request, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      vehicle:vehicles(*),
      customer:customers(*), 
      request_parts(*)
    `)
    .eq("id", id)
    .single();

  if (error || !request) {
      return (
        <div className="p-8 text-red-600 bg-red-50 min-h-screen">
            <h1 className="text-xl font-bold mb-2">❌ Invoice Error</h1>
            <p>Could not load ticket details.</p>
            <pre className="text-xs mt-4 bg-white p-4 border rounded">{error?.message}</pre>
        </div>
      );
  }

  // 2. Check if an Invoice was already created
  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("service_request_id", id)
    .single();

  return (
    <InvoiceEditor 
      request={request} 
      existingInvoice={existingInvoice} 
    />
  );
}