import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PDFLogsPage() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("pdf_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">PDF Activity Logs</h1>

      {error ? (
        <div className="text-red-600">{error.message}</div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-2 text-left">Timestamp</th>
                <th className="p-2 text-left">Request</th>
                <th className="p-2 text-left">Action</th>
                <th className="p-2 text-left">Actor</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Meta</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((log: any) => (
                <tr key={log.id} className="border-b">
                  <td className="p-2">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-2">{log.request_id}</td>
                  <td className="p-2 capitalize">{log.action}</td>
                  <td className="p-2">{log.actor || "—"}</td>
                  <td className="p-2">{log.actor_email || "—"}</td>
                  <td className="p-2">
                    {log.meta ? JSON.stringify(log.meta) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
