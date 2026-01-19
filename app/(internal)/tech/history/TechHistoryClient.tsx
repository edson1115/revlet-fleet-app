"use client";

import { useRouter } from "next/navigation";

export default function TechHistoryClient({ jobs }: { jobs: any[] }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-32">
      {/* HEADER */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-5 sticky top-0 z-30 shadow-lg">
        <h1 className="text-xl font-black tracking-tight text-white">Job History</h1>
        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Your Completed Work</p>
      </div>

      <div className="p-4 space-y-3">
        {jobs.length === 0 ? (
           <div className="text-center py-20 text-zinc-500">No completed jobs found.</div>
        ) : (
           jobs.map((job) => (
             <div 
               key={job.id}
               onClick={() => router.push(`/tech/jobs/${job.id}`)}
               className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 active:scale-95 transition cursor-pointer"
             >
                <div className="flex justify-between items-start mb-2">
                   <div className="font-bold text-white text-lg">
                      {job.vehicle?.year} {job.vehicle?.model}
                   </div>
                   <span className="text-[10px] font-black bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">
                      {new Date(job.completed_at).toLocaleDateString()}
                   </span>
                </div>
                <div className="text-sm text-zinc-500 mb-1">{job.service_title}</div>
                <div className="text-xs font-mono text-zinc-600">{job.vehicle?.plate}</div>
             </div>
           ))
        )}
      </div>
    </div>
  );
}