"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { formatDistanceToNow } from "date-fns";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";

export default function PMDashboard() {
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchSchedules = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("pm_schedules")
        .select(`*, vehicle:vehicles(plate, unit_number, current_odometer, customer:customers(company_name))`)
        .order("next_due_date", { ascending: true });
      setSchedules(data || []);
      setLoading(false);
  };

  useEffect(() => { fetchSchedules(); }, []);

  const runScanner = async () => {
      setScanning(true);
      const res = await fetch("/api/admin/pm/scan", { method: "POST" });
      const data = await res.json();
      alert(`Scanner Finished.\nCreated ${data.tickets_created} new tickets.`);
      setScanning(false);
  };

  if (loading) return <div className="p-12 text-center text-zinc-400">Loading Fleet Health...</div>;

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-zinc-900 font-sans p-8">
      
      <div className="flex justify-between items-end mb-10">
          <div className="flex-1">
             <TeslaHeroBar
                 title="Fleet PM Schedules"
                 meta={[
                   { label: "Monitored Vehicles", value: String(schedules.length) },
                   { label: "Due Soon", value: String(schedules.filter((s: any) => new Date(s.next_due_date) < new Date()).length) }
                 ]}
              />
          </div>
          <button 
             onClick={runScanner}
             disabled={scanning}
             className="mb-8 ml-4 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
             {scanning ? "Scanning Fleet..." : "⚡ Run Auto-Scanner"}
          </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vehicle</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Service</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Due Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Miles Status</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                  {schedules.map((s) => {
                      const isOverdue = new Date() > new Date(s.next_due_date);
                      const milesDue = (s.last_service_odometer || 0) + s.interval_miles;
                      const milesLeft = milesDue - (s.vehicle.current_odometer || 0);

                      return (
                          <tr key={s.id} className="hover:bg-blue-50/50 transition-colors">
                              <td className="px-6 py-4">
                                  {isOverdue || milesLeft < 0 ? (
                                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">Due Now</span>
                                  ) : (
                                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">OK</span>
                                  )}
                              </td>
                              <td className="px-6 py-4">
                                  <div className="font-bold text-zinc-900">{s.vehicle.plate}</div>
                                  <div className="text-xs text-zinc-400">{s.vehicle.customer?.company_name}</div>
                              </td>
                              <td className="px-6 py-4 font-bold text-sm text-zinc-700">{s.service_name}</td>
                              <td className="px-6 py-4 text-xs font-mono text-zinc-500">
                                  {new Date(s.next_due_date).toLocaleDateString()}
                                  <div className="text-[10px] text-zinc-400">{formatDistanceToNow(new Date(s.next_due_date), { addSuffix: true })}</div>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden w-24">
                                          <div 
                                            className={`h-full ${milesLeft < 500 ? 'bg-amber-400' : 'bg-blue-500'}`} 
                                            style={{ width: `${Math.min(100, (s.vehicle.current_odometer / milesDue) * 100)}%` }}
                                          ></div>
                                      </div>
                                      <span className="text-[10px] font-mono text-zinc-400">{milesLeft} mi left</span>
                                  </div>
                              </td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>
          {schedules.length === 0 && <div className="p-8 text-center text-zinc-400 italic">No schedules set up yet.</div>}
      </div>
    </div>
  );
}