"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

// --- ICONS ---
const IconCar = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const IconPlus = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const IconTire = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconSearch = () => <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconBox = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;

export default function CustomerDashboardClient({ 
  requests, 
  customerName, 
  stats 
}: { 
  requests: any[], 
  customerName: string,
  stats: { inProgress: number, pending: number, completed: number }
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  // Filter Logic
  const filteredRequests = requests.filter(r => 
    r.service_title?.toLowerCase().includes(search.toLowerCase()) ||
    r.vehicle?.model?.toLowerCase().includes(search.toLowerCase()) ||
    r.vehicle?.plate?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-w-0 bg-[#f8f9fa] min-h-full">
          
          {/* HEADER */}
          <div className="bg-white px-8 py-5 flex justify-between items-center border-b border-gray-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/90">
             <div>
                <h1 className="font-bold text-gray-900 leading-none text-xl">{customerName}</h1>
                <p className="text-xs font-bold text-gray-400 uppercase mt-1">Fleet Command</p>
             </div>
             
             <button 
                onClick={() => router.push('/customer/requests/new')}
                className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 transition transform active:scale-95 flex items-center gap-2"
             >
                <IconPlus /> Request Service
             </button>
          </div>

          {/* DASHBOARD CONTENT */}
          <div className="p-8 max-w-6xl mx-auto w-full">

              {/* 📊 LIVE FLEET STATS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Active in Shop</p>
                    <div className="text-4xl font-black mt-1 text-gray-900">{stats.inProgress}</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Scheduled</p>
                    <div className="text-4xl font-black mt-1 text-gray-900">{stats.pending}</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Done / Ready</p>
                    <div className="text-4xl font-black mt-1 text-gray-900">{stats.completed}</div>
                </div>
              </div>
              
              {/* QUICK ACTIONS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                 <div onClick={() => router.push('/customer/requests/new')} className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg cursor-pointer hover:bg-blue-700 transition transform hover:-translate-y-1 group">
                    <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition"><IconPlus /></div>
                    <div className="font-black text-xl leading-tight">New Request</div>
                    <div className="text-blue-200 text-sm font-medium mt-1">Schedule service for a vehicle.</div>
                 </div>

                 <div onClick={() => router.push('/customer/tires')} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm cursor-pointer hover:border-black hover:shadow-md transition group">
                    <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center mb-4 text-gray-600 group-hover:bg-black group-hover:text-white transition"><IconTire /></div>
                    <div className="font-bold text-lg text-gray-900">Order Tires</div>
                    <div className="text-gray-500 text-xs mt-1">Browse inventory & place orders.</div>
                 </div>

                 <div onClick={() => router.push('/customer/vehicles/new')} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm cursor-pointer hover:border-black hover:shadow-md transition group">
                    <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center mb-4 text-gray-600 group-hover:bg-black group-hover:text-white transition"><IconCar /></div>
                    <div className="font-bold text-lg text-gray-900">Add Vehicle</div>
                    <div className="text-gray-500 text-xs mt-1">Register a new unit to fleet.</div>
                 </div>
              </div>

              {/* RECENT HISTORY */}
              <div className="flex justify-between items-end mb-6">
                  <h2 className="text-xl font-black text-gray-900">Recent Activity</h2>
                  <div className="relative">
                    <input 
                        placeholder="Search VIN or Model..." 
                        className="pl-4 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-black outline-none transition w-64 shadow-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <IconSearch className="absolute right-3 top-2.5" />
                  </div>
              </div>

              <div className="space-y-4">
                  {filteredRequests.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-400 font-bold">No matching records found.</p>
                    </div>
                  )}

                  {filteredRequests.map((r) => {
                      const hasVehicle = !!r.vehicle;
                      const title = hasVehicle 
                          ? `${r.vehicle.year} ${r.vehicle.model}` 
                          : r.service_title; 
                      
                      const subtitle = hasVehicle 
                          ? r.vehicle.plate 
                          : "BULK ORDER / NO ASSET";

                      const displayService = hasVehicle ? r.service_title : "Procurement";

                      return (
                          <div 
                            key={r.id}
                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex justify-between items-center group"
                          >
                              <div className="flex items-center gap-5">
                                  <div className={clsx(
                                      "w-12 h-12 rounded-xl flex items-center justify-center transition shadow-sm",
                                      r.status === 'COMPLETED' ? "bg-green-100 text-green-600" : 
                                      r.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-600 animate-pulse" : "bg-gray-100 text-gray-400"
                                  )}>
                                      {hasVehicle ? <IconCar /> : <IconBox />}
                                  </div>
                                  <div>
                                      <div className="flex items-center gap-3 mb-1">
                                          <h3 className="font-bold text-gray-900 text-base">{title}</h3>
                                          <span className={clsx(
                                              "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border",
                                              r.status === 'COMPLETED' ? "bg-green-50 text-green-700 border-green-100" : 
                                              r.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-gray-50 text-gray-600 border-gray-200"
                                          )}>
                                              {r.status.replace(/_/g, " ")}
                                          </span>
                                      </div>
                                      <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                                          <span>{displayService}</span>
                                          <span className="text-gray-300">•</span>
                                          <span className="font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded text-xs uppercase">
                                              {subtitle || "N/A"}
                                          </span>
                                      </div>
                                  </div>
                              </div>

                              <div className="text-right">
                                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Service Date</div>
                                  <div className="font-bold text-gray-900 text-sm font-mono">{new Date(r.created_at).toLocaleDateString()}</div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
    </div>
  );
}