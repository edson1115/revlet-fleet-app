"use client";

export function TeslaLeadCard({ lead, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white p-4 rounded-xl border hover:border-black transition"
    >
      <div className="font-semibold text-lg">{lead.customer_name}</div>
      <div className="text-gray-500 text-sm">{lead.company_name}</div>

      <div className="mt-2 text-xs inline-block px-2 py-1 bg-gray-100 rounded-full">
        {lead.status}
      </div>

      <div className="text-[11px] text-gray-400 mt-2">
        {new Date(lead.created_at).toLocaleDateString()}
      </div>
    </button>
  );
}
