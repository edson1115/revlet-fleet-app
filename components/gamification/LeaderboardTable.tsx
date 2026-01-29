"use client";

import clsx from "clsx";

const IconTrophy = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const IconFire = () => <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" /></svg>;

export default function LeaderboardTable({ data }: { data: any[] }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-400 font-black uppercase text-[10px] tracking-widest border-b border-zinc-100">
            <tr>
              <th className="px-6 py-4 w-16 text-center">Rank</th>
              <th className="px-6 py-4">Technician</th>
              <th className="px-6 py-4">Current Level</th>
              <th className="px-6 py-4 text-center">Streak</th>
              <th className="px-6 py-4 text-right">Total XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {data.map((player, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;
              
              // Styling for the Podium
              const rowClass = 
                rank === 1 ? "bg-yellow-50/50 hover:bg-yellow-50" :
                rank === 2 ? "bg-slate-50/50 hover:bg-slate-50" :
                rank === 3 ? "bg-orange-50/50 hover:bg-orange-50" :
                "hover:bg-zinc-50";

              const badgeColor = 
                rank === 1 ? "bg-yellow-400 text-yellow-900 ring-4 ring-yellow-100" :
                rank === 2 ? "bg-slate-300 text-slate-800 ring-4 ring-slate-100" :
                rank === 3 ? "bg-orange-300 text-orange-900 ring-4 ring-orange-100" :
                "bg-zinc-100 text-zinc-500";

              return (
                <tr key={player.id} className={`transition duration-150 ${rowClass}`}>
                  <td className="px-6 py-4 text-center">
                    <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center font-black text-xs mx-auto", badgeColor)}>
                       {rank <= 3 ? <IconTrophy /> : rank}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                            {player.profiles?.full_name?.charAt(0) || "?"}
                        </div>
                        <span className="font-bold text-zinc-900 text-base">{player.profiles?.full_name || "Unknown Tech"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx("px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide", 
                        player.current_level === 'MASTER' ? "bg-black text-white" :
                        player.current_level === 'ELITE' ? "bg-purple-100 text-purple-700" :
                        player.current_level === 'GOLD' ? "bg-yellow-100 text-yellow-700" :
                        "bg-zinc-100 text-zinc-600"
                    )}>
                        {player.current_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {player.current_streak > 0 && (
                        <div className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-1 rounded-full text-xs font-bold border border-orange-100">
                            <IconFire /> {player.current_streak} Day
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-black text-zinc-900 text-lg tabular-nums tracking-tight">
                        {player.total_xp.toLocaleString()} <span className="text-xs text-zinc-400 font-bold uppercase ml-0.5">XP</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}