import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const scope = await resolveUserScope();
  if (!scope.uid) redirect("/login");

  const supabase = await supabaseServer();

  // ✅ FETCH ONLY COMPLETED JOBS
  const { data: history } = await supabase
    .from("service_requests")
    .select(`
      id,
      created_at,
      service_title,
      status,
      customer:customers(name),
      vehicle:vehicles(year, make, model, plate)
    `)
    .eq("status", "COMPLETED") // Only show finished work
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
       <h1 className="text-2xl font-bold mb-6">Service History</h1>
       
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
             <thead className="bg-gray-50 border-b">
                <tr>
                   <th className="px-6 py-3 font-bold text-gray-500">Date</th>
                   <th className="px-6 py-3 font-bold text-gray-500">Customer</th>
                   <th className="px-6 py-3 font-bold text-gray-500">Vehicle</th>
                   <th className="px-6 py-3 font-bold text-gray-500">Service</th>
                   <th className="px-6 py-3 font-bold text-gray-500">Status</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                {(!history || history.length === 0) && (
                   <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No completed jobs yet.</td>
                   </tr>
                )}
                {history?.map((row: any) => (
                   <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-500">{new Date(row.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold">{row.customer?.name}</td>
                      <td className="px-6 py-4">{row.vehicle?.year} {row.vehicle?.model}</td>
                      <td className="px-6 py-4">{row.service_title}</td>
                      <td className="px-6 py-4">
                         <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold text-xs">COMPLETED</span>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
}