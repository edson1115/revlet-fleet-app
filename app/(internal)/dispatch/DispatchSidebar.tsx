"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function DispatchSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <span className="font-bold text-lg tracking-tight">Revlet Dispatch</span>
      </div>
      
      <div className="p-2 space-y-1 overflow-y-auto flex-1">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4 px-2">
          Menu
        </div>
        {/* Placeholder links to pass build */}
        <Link href="/dispatch" className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50">
          Dashboard
        </Link>
        <Link href="/dispatch/assign" className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50">
          Assign Techs
        </Link>
      </div>
    </div>
  );
}