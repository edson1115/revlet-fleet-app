import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Helper to get REAL counts
async function getStats() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.getAll().find(c => c.name.includes("-auth-token"));
  
  if (!authCookie) return { customers: 0, pending: 0, active: 0 }; 

  let token = authCookie.value;
  try {
     if (token.startsWith("base64-")) token = Buffer.from(token.replace("base64-", ""), 'base64').toString('utf-8');
     const parsed = JSON.parse(decodeURIComponent(token));
     token = parsed.access_token;
  } catch(e) { /* use raw */ }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const [cust, reqNew, reqActive] = await Promise.all([
     supabase.from("customers").select("*", { count: 'exact', head: true }),
     supabase.from("service_requests").select("*", { count: 'exact', head: true }).eq('status', 'NEW'),
     supabase.from("service_requests").select("*", { count: 'exact', head: true }).in('status', ['NEW', 'WAITING', 'SCHEDULED', 'IN_PROGRESS'])
  ]);

  return {
    customers: cust.count || 0,
    pending: reqNew.count || 0,
    active: reqActive.count || 0
  };
}

export const dynamic = "force-dynamic";

export default async function AdminHub() {
  const stats = await getStats();

  return (
    <div className="max-w-6xl mx-auto p-8">
      
      {/* HEADER */}
      <div className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">
              COMMAND<span className="text-green-600">CENTER</span>
          </h1>
          <p className="text-gray-500 text-lg">Select a dashboard to manage operations.</p>
      </div>

      {/* DASHBOARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          <Link href="/office" className="group">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all cursor-pointer h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl group-hover:scale-110 transition-transform">🏢</div>
                  <div className="relative z-10">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-4 text-blue-600">🖥️</div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Office View</h2>
                      <p className="text-gray-500 text-sm">Manage Work Orders, Approve Sales Leads.</p>
                      <div className="mt-6 text-blue-600 font-bold text-sm">Enter Dashboard &rarr;</div>
                  </div>
              </div>
          </Link>

          {/* DISPATCH BOARD - NOW ACTIVE */}
          <Link href="/dispatch" className="group">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-orange-500 transition-all cursor-pointer h-full relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl group-hover:scale-110 transition-transform">🚚</div>
                   <div className="relative z-10">
                       <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl mb-4 text-orange-600">🗺️</div>
                       <h2 className="text-2xl font-bold text-gray-900 mb-2">Dispatch Board</h2>
                       <p className="text-gray-500 text-sm">Schedule technicians, assign routes.</p>
                       <div className="mt-6 flex items-center gap-2">
                           <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                           <span className="text-orange-600 font-bold text-sm">Live Monitoring &rarr;</span>
                       </div>
                   </div>
              </div>
          </Link>

          {/* TECH APP - STILL LOCKED */}
          <div className="group opacity-60 cursor-not-allowed">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm h-full relative">
                   <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">🛠️</div>
                   <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl mb-4 text-purple-600">🔧</div>
                   <h2 className="text-2xl font-bold text-gray-900 mb-2">Tech App</h2>
                   <p className="text-gray-500 text-sm">(Coming Soon)</p>
              </div>
          </div>
      </div>

      {/* REAL STATS BAR */}
      <div className="bg-black text-white p-8 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                  <div className="text-gray-400 text-xs font-bold uppercase mb-1">Total Customers</div>
                  <div className="text-4xl font-black">{stats.customers}</div>
              </div>
              <div>
                  <div className="text-gray-400 text-xs font-bold uppercase mb-1">Pending Approvals</div>
                  <div className="text-4xl font-black text-yellow-400">{stats.pending}</div>
              </div>
              <div>
                  <div className="text-gray-400 text-xs font-bold uppercase mb-1">Active Work Orders</div>
                  <div className="text-4xl font-black text-blue-400">{stats.active}</div>
              </div>
              <div>
                  <div className="text-gray-400 text-xs font-bold uppercase mb-1">Revenue (Mo)</div>
                  <div className="text-4xl font-black text-green-400">$0.00</div>
              </div>
          </div>
      </div>
    </div>
  );
}