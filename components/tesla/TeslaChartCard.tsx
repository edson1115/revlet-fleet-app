"use client";

export function TeslaChartCard({ labels, values }: any) {
  const max = Math.max(...values, 1);

  return (
    <div className="bg-white rounded-xl p-6 border">
      <div className="grid grid-cols-7 gap-4 h-40 items-end">
        {values.map((v: number, i: number) => (
          <div key={i} className="flex flex-col items-center">
            <div
              className="w-6 rounded bg-black transition-all"
              style={{ height: `${(v / max) * 100}%` }}
            />
            <div className="text-xs text-gray-500 mt-2">{labels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
