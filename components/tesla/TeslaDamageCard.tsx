"use client";

export default function TeslaDamageCard({ analysis }: any) {
  if (!analysis) return null;

  return (
    <div className="p-4 bg-white border rounded-xl space-y-3">
      <h3 className="font-semibold text-lg">AI Damage Report</h3>

      <div className="text-sm text-gray-700">{analysis.summary}</div>

      <div>
        <div className="text-xs text-gray-500">Risk Level</div>
        <div className="font-medium">{analysis.risk_level}</div>
      </div>

      <div className="space-y-2">
        {analysis.items.map((item: any, i: number) => (
          <div
            key={i}
            className="p-2 bg-gray-50 border rounded-lg text-sm"
          >
            <strong>{item.part}</strong>: {item.issue}  
            <span className="text-red-600 ml-2">{item.severity}</span>
          </div>
        ))}
      </div>

      <div>
        <div className="text-xs text-gray-500">Tech Notes</div>
        <div className="text-sm">{analysis.technician_notes}</div>
      </div>
    </div>
  );
}
