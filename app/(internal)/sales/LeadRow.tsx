"use client";

import { ChevronRight } from "lucide-react";

interface LeadRowProps {
  lead: any;
  onClick: (lead: any) => void;
}

export default function LeadRow({ lead, onClick }: LeadRowProps) {
  return (
    <div
      onClick={() => onClick(lead)}
      className="flex items-center justify-between p-4 border-b hover:bg-gray-50 cursor-pointer transition"
    >
      <div>
        <div className="font-semibold text-gray-900">
          {lead.company_name || "Unnamed Lead"}
        </div>
        <div className="text-sm text-gray-500">
          {lead.contact_name} • {lead.city || "No City"}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </div>
  );
}