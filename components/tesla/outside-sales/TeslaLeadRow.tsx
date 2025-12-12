"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

export function TeslaLeadRow({ lead, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition border-b"
    >
      <div className="flex flex-col">
        <span className="font-medium">
          {lead.customer_name || "Unnamed Customer"}
        </span>

        <span className="text-xs text-gray-500">
          {lead.company_name || "—"}
        </span>

        {/* 🔥 AUTO SYNC INDICATOR */}
        {lead.auto_converted && (
          <span className="text-[11px] text-green-600 mt-1">
            ✓ Auto-Synced to Revlet
          </span>
        )}
      </div>

      <ChevronRight className="w-5 h-5 text-gray-400" />
    </button>
  );
}
