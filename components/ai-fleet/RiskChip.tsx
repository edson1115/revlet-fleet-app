export function RiskChip({ risk }: { risk: any }) {
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <p className="font-medium">{risk.component}</p>
      <p className="text-sm text-gray-600 mt-1">{risk.message}</p>

      <div className="mt-2 text-xs font-medium">
        Risk: <span className="uppercase">{risk.level}</span>
      </div>
    </div>
  );
}
