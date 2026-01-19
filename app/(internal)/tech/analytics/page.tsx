import { redirect } from "next/navigation";
import { supabaseServerReadonly } from "@/lib/supabase/server-readonly";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export default async function TechAnalyticsPage() {
  const scope = await resolveUserScope();
  if (!scope.uid) redirect("/login");

  const supabase = await supabaseServerReadonly();

  // Fetch Stats Data
  const { data: jobs } = await supabase
    .from("service_requests")
    .select("id, completed_at, request_images(id)")
    .or(`technician_id.eq.${scope.uid},second_technician_id.eq.${scope.uid}`)
    .eq("status", "COMPLETED");

  const list = jobs || [];
  
  // Calculate Metrics
  const today = new Date().toDateString();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const completedToday = list.filter(j => new Date(j.completed_at).toDateString() === today).length;
  const completedWeek = list.filter(j => new Date(j.completed_at) > weekAgo).length;
  const totalPhotos = list.reduce((acc, job) => acc + (job.request_images?.length || 0), 0);

  // Reusable Card Component
  const StatCard = ({ label, val, sub }: any) => (
    <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
       <div className="text-3xl font-black text-white mb-1">{val}</div>
       <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</div>
       {sub && <div className="text-[10px] text-zinc-600 mt-2">{sub}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-32">
       <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-5 sticky top-0 z-30 shadow-lg">
          <h1 className="text-xl font-black tracking-tight text-white">Performance</h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Productivity Insights</p>
       </div>

       <div className="p-5 grid grid-cols-2 gap-4">
          <StatCard label="Today" val={completedToday} sub="Jobs Completed" />
          <StatCard label="This Week" val={completedWeek} sub="Jobs Completed" />
          <StatCard label="Photos" val={totalPhotos} sub="Total Uploads" />
          <StatCard label="Total" val={list.length} sub="Career Jobs" />
       </div>
    </div>
  );
}