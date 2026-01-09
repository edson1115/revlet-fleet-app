"use client";

import clsx from "clsx";

export default function TechLeaderboard({ techs }: { techs: any[] }) {
  // Sort techs by total jobs completed (volume) then by avg speed (efficiency)
  const ranked = [...techs].sort((a, b) => {
    if (b.jobsCompleted !== a.jobsCompleted) return b.jobsCompleted - a.jobsCompleted;
    return a.avgTime - b.avgTime;
  });

  return (
    <div className="bg-white rounded-[3rem] border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
        <div>
          <h3 className="text-xl font-black uppercase italic tracking-tight text-zinc-900">Elite Technician Rankings</h3>
          <p className="text-zinc-500 text-[10px] font-black uppercase mt-1 tracking-widest italic">Live Performance Audit</p>
        </div>
      </div>

      <div className="divide-y divide-zinc-50">
        {ranked.length > 0 ? ranked.map((tech, index) => (
          <div key={tech.id} className="p-6 flex items-center justify-between group hover:bg-zinc-50 transition-all">
            <div className="flex items-center gap-6">
              <span className={clsx(
                "text-2xl font-black italic w-10 text-center",
                index === 0 ? "text-amber-400 drop-shadow-sm" : index === 1 ? "text-zinc-400" : "text-zinc-200"
              )}>
                #{index + 1}
              </span>
              <div>
                <h4 className="font-black text-zinc-900 uppercase tracking-tighter leading-none">{tech.name}</h4>
                <p className="text-[9px] font-black text-zinc-400 mt-1 uppercase tracking-widest italic">{tech.market}</p>
              </div>
            </div>

            <div className="flex gap-12 items-center">
              <div className="text-right">
                <p className="text-lg font-black text-zinc-900 leading-none tracking-tighter">{tech.jobsCompleted}</p>
                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Jobs Done</p>
              </div>
              <div className="text-right w-24">
                <p className="text-lg font-black text-emerald-500 leading-none tracking-tighter">{tech.avgTime}m</p>
                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Avg Completion</p>
              </div>
            </div>
          </div>
        )) : (
            <div className="p-20 text-center text-zinc-300 font-black uppercase tracking-[0.3em] italic">
                Pending Service Completions...
            </div>
        )}
      </div>
    </div>
  );
}