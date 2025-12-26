import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaCustomerRow } from "@/components/tesla/office/TeslaCustomerRow";

export const dynamic = "force-dynamic";

export default async function OfficeCustomersPage() {
  const supabase = await supabaseServer();

  // 1. Fetch Customers with Vehicle Counts
  const { data: customers } = await supabase
    .from("customers")
    .select(`
      *,
      vehicles:vehicles(count)
    `)
    .order("name");

  // Format data for the row component
  const rows = customers?.map((c: any) => ({
    ...c,
    vehicle_count: c.vehicles?.[0]?.count ?? 0,
  })) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 font-medium">
            <Link href="/office" className="hover:text-black hover:underline transition">
              &larr; Back to Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-black">Fleet Accounts</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black">
            Customers & Fleets
          </h1>
        </div>
        <button 
            disabled
            className="bg-gray-100 text-gray-400 px-5 py-2 rounded-lg text-sm font-bold cursor-not-allowed"
        >
            + New Customer
        </button>
      </div>

      {/* CONTENT */}
      <TeslaSection>
        {!rows.length && (
          <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-xl">
             <p className="text-gray-500">No customers found.</p>
          </div>
        )}

        <div className="flex flex-col">
          {rows.map((c) => (
             // Wrap the row in a Link to the detail page
             <Link key={c.id} href={`/office/customers/${c.id}`} className="block">
                <TeslaCustomerRow customer={c} />
             </Link>
          ))}
        </div>
      </TeslaSection>
    </div>
  );
}