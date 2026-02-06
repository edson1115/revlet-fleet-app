"use client";

import { X } from "lucide-react";

export default function Header({ lead, onClose }: any) {
  return (
    <div className="flex items-center justify-between p-6 border-b bg-white">
      <div>
        <h2 className="text-xl font-bold">{lead?.company_name || "Lead Details"}</h2>
        <div className="text-sm text-gray-500">
             {lead?.contact_name || "Contact Info"}
        </div>
      </div>
      <button 
        onClick={onClose} 
        className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}