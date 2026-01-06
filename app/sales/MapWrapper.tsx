"use client";

import dynamic from "next/dynamic";

// Dynamically import the map with SSR disabled
// This works here because this file is marked "use client"
const LeadsMap = dynamic(() => import("./LeadsMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 animate-pulse">
      Loading Map Territory...
    </div>
  ),
});

export default function MapWrapper({ leads }: { leads: any[] }) {
  return <LeadsMap leads={leads} />;
}