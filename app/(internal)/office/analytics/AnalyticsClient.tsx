"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// --- ICONS ---
const IconChart = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const IconArrowUp = () => <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
const IconDollar = () => <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export default function AnalyticsClient() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/office/analytics")
      .then((res) => res.json())
      .then((js) => {
        setData(js);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
           <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
           <div className="h-4 w-32 bg-gray-200 rounded"></div>
           <p className="text-gray-400 text-xs mt-2 font-bold">Crunching Numbers...</p>
        </div>
      </div>
    );
  }

  const { stats, topServices, recentSales } = data;

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-20">
      
      {/* HEADER */}
      <div className="bg-white px-8 py-4 border-b border-gray-200 sticky top-0 z-10 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-4">
            <div 
              onClick={() => router.push("/office")}
              className="bg-black text-white px-3 py-1 rounded text-xl font-black tracking-tighter italic cursor-pointer hover:bg-gray-800 transition"
            >
              REVLET
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <div>
                <h1 className="font-bold text-gray-900 leading-none">Analytics</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Financial Performance</p>
            </div>
         </div>
         <button onClick={() => router.push("/office")} className="text-xs font-bold text-gray-500 hover:text-black">
            &larr; Back to Dashboard
         </button>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-8">
         
         {/* 1. KEY METRICS */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* GROSS REVENUE */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div className="bg-green-50 p-3 rounded-xl">
                     <IconDollar />
                  </div>
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                     <IconArrowUp /> Live
                  </span>
               </div>
               <div className="text-3xl font-black text-gray-900 mb-1">
                  ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </div>
               <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Gross Revenue</div>
            </div>

            {/* AVG TICKET */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
               <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-blue-600 font-bold text-xl">
                  🎫
               </div>
               <div className="text-3xl font-black text-gray-900 mb-1">
                  ${stats.avgTicket.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
               </div>
               <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg. Ticket Size</div>
            </div>

            {/* TOTAL INVOICES */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
               <div className="bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-purple-600 font-bold text-xl">
                  📄
               </div>
               <div className="text-3xl font-black text-gray-900 mb-1">
                  {stats.totalTickets}
               </div>
               <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paid Invoices</div>
            </div>

            {/* PIPELINE */}
            <div className="bg-black text-white p-6 rounded-2xl shadow-lg">
               <div className="bg-gray-800 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white font-bold text-xl">
                  ⏳
               </div>
               <div className="text-3xl font-black mb-1">
                  {stats.pendingCount}
               </div>
               <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Jobs in Pipeline</div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 2. REVENUE BY SERVICE */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
               <div className="flex items-center gap-2 mb-6">
                  <IconChart />
                  <h3 className="font-bold text-gray-900">Top Revenue Drivers</h3>
               </div>
               <div className="space-y-4">
                  {topServices.map((svc: any, i: number) => {
                     const percent = (svc.value / (stats.totalRevenue || 1)) * 100;
                     return (
                        <div key={i}>
                           <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                              <span>{svc.name}</span>
                              <span>${svc.value.toLocaleString()}</span>
                           </div>
                           <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-black h-2 rounded-full" 
                                style={{ width: `${percent}%` }}
                              ></div>
                           </div>
                        </div>
                     )
                  })}
                  {topServices.length === 0 && (
                     <p className="text-sm text-gray-400 italic">No revenue data yet.</p>
                  )}
               </div>
            </div>

            {/* 3. RECENT TRANSACTIONS */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
               <h3 className="font-bold text-gray-900 mb-6">Recent Transactions</h3>
               <div className="space-y-4">
                  {recentSales.map((sale: any, i: number) => (
                     <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                           <div className="font-bold text-sm text-gray-900">{sale.service_title}</div>
                           <div className="text-xs text-gray-500 font-mono">
                              {new Date(sale.created_at).toLocaleDateString()}
                           </div>
                        </div>
                        <div className="font-mono font-bold text-green-600">
                           +${sale.invoice_grand_total?.toFixed(2)}
                        </div>
                     </div>
                  ))}
                   {recentSales.length === 0 && (
                     <p className="text-sm text-gray-400 italic">No closed invoices yet.</p>
                  )}
               </div>
               <button 
                  onClick={() => router.push("/office")}
                  className="w-full mt-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black hover:bg-gray-50 rounded-lg transition"
               >
                  View All Requests
               </button>
            </div>
         </div>

      </div>
    </div>
  );
}