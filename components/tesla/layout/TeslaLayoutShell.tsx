"use client";

import { TeslaSidebar } from "./TeslaSidebar";
import { TeslaTopBar } from "./TeslaTopBar";
import TeslaBreadcrumbs from "./TeslaBreadcrumbs";

export default function TeslaLayoutShell({ children }: any) {
  return (
    <div className="flex bg-[#F5F5F5] min-h-screen">

      {/* SIDEBAR */}
      <TeslaSidebar />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">

        {/* TOP BAR */}
        <TeslaTopBar />

        {/* CONTENT */}
        <div className="px-10 py-10 animate-fade-in">
          <TeslaBreadcrumbs />
          <div className="mt-6">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}
