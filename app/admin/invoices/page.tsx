import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { resolveUserScope } from "@/lib/api/scope";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const scope = await resolveUserScope();
  if (!scope.isAdmin && !scope.isSuperadmin && !scope.isOffice) redirect("/");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch "Unbilled" Work (Completed Tickets with NO invoice_id)
  const { data: unbilledTickets } = await supabase
    .from("service_requests")
    .select("*, customers(company_name), vehicles(plate, unit_number)")
    .eq("status", "COMPLETED")
    .is("invoice_id", null) 
    .order("updated_at", { ascending: false });

  // 2. Fetch "Active Invoices" (Sent but not paid, or Paid)
  const { data: recentInvoices } = await supabase
    .from("invoices")
    .select("*, customers(company_name)")
    .order("created_at", { ascending: false })
    .limit(20);

  // MOCK DATA
  const mockInvoices = recentInvoices || [
      { id: "INV-2024-001", customer: { company_name: "Hertz Rental" }, total: 450.00, status: "PAID", due_date: "2024-02-01" },
      { id: "INV-2024-002", customer: { company_name: "DHL Express" }, total: 1250.00, status: "PENDING", due_date: "2024-02-15" },
      { id: "INV-2024-003", customer: { company_name: "Bob's Plumbing" }, total: 85.00, status: "OVERDUE", due_date: "2024-01-20" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-zinc-900 font-sans p-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 uppercase italic">Invoicing & Payments</h1>
          <p className="text-zinc-500">Manage cash flow, bill fleets, and track revenue.</p>
        </div>
        <div className="flex gap-3">
             <button className="bg-white border border-zinc-200 text-zinc-600 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-50">
                ⚙️ Tax Settings
             </button>
             <button className="bg-black text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 shadow-lg shadow-black/20">
                + Create Manual Invoice
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT: UNBILLED WORK (The "To-Do" List) --- */}
          <div className="space-y-6">
              <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Ready to Invoice ({unbilledTickets?.length || 0})</h2>
              </div>
              
              {(!unbilledTickets || unbilledTickets.length === 0) ? (
                  <div className="bg-white p-8 rounded-3xl border border-dashed border-zinc-300 text-center text-zinc-400 text-sm">
                      🎉 All caught up! <br/>No completed jobs waiting for billing.
                  </div>
              ) : (
                  unbilledTickets.map((ticket) => (
                      <div key={ticket.id} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:border-blue-400 transition-colors group relative">
                          <div className="flex justify-between items-start mb-2">
                              <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider">Completed</span>
                              <span className="text-[10px] text-zinc-400 font-mono">{formatDistanceToNow(new Date(ticket.updated_at))} ago</span>
                          </div>
                          
                          <div className="font-bold text-zinc-900">{ticket.customers?.company_name || "Unknown Fleet"}</div>
                          <div className="text-xs text-zinc-500 mb-3">{ticket.service_title} • Unit #{ticket.vehicles?.unit_number || "N/A"}</div>
                          
                          <div className="pt-3 border-t border-zinc-50 flex gap-2">
                              {/* 🔗 CONNECTED: This Link now takes you to the specific invoice builder for this ticket */}
                              <Link 
                                href={`/office/requests/${ticket.id}/invoice`}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-blue-500 shadow-lg shadow-blue-600/20 text-center block"
                              >
                                  Generate Bill
                              </Link>
                          </div>
                      </div>
                  ))
              )}
          </div>

          {/* --- RIGHT: INVOICE HISTORY (The "Ledger") --- */}
          <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Recent Invoices</h2>
              
              <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                      <thead className="bg-zinc-50 border-b border-zinc-100">
                          <tr>
                              <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                              <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Invoice #</th>
                              <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Customer</th>
                              <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Amount</th>
                              <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Due Date</th>
                              <th className="px-6 py-4"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                          {mockInvoices.map((inv: any) => (
                              <tr key={inv.id} className="hover:bg-zinc-50/80 transition-colors group">
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                                          inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                          inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                                          'bg-amber-100 text-amber-700'
                                      }`}>
                                          {inv.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 font-mono text-xs font-bold text-zinc-600">{inv.id}</td>
                                  <td className="px-6 py-4 text-sm font-bold text-zinc-900">{inv.customer?.company_name}</td>
                                  <td className="px-6 py-4 text-sm font-bold text-zinc-900 text-right">${inv.total.toFixed(2)}</td>
                                  <td className="px-6 py-4 text-xs text-zinc-500">{inv.due_date}</td>
                                  <td className="px-6 py-4 text-right">
                                      <button className="text-zinc-400 hover:text-blue-600 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                          View →
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>

      </div>
    </div>
  );
}