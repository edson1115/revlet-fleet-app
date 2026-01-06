import { supabaseServer } from "@/lib/supabase/server";

export default async function OfficeQueuePage() {
  const supabase = await supabaseServer();
  const { data: requests } = await supabase
    .from("service_requests")
    .select("*, customers(name), vehicles(vin, year, make, model)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Service Queue</h1>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">
          {requests?.length || 0} Active
        </span>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4">Vehicle</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests?.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-medium">{req.customers?.name || "Unknown"}</td>
                <td className="p-4 text-gray-500">
                  {req.vehicles?.year} {req.vehicles?.make} {req.vehicles?.model}
                  <div className="text-xs text-gray-400">{req.vehicles?.vin}</div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase">
                    {req.status}
                  </span>
                </td>
                <td className="p-4 text-gray-400">
                  {new Date(req.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {(!requests || requests.length === 0) && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-gray-400">
                  No requests found in queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}