"use client";

import dynamic from "next/dynamic";

const Heatmap = dynamic(() => import("./Heatmap"), { ssr: false });
const Clusters = dynamic(() => import("./Clusters"), { ssr: false });

export default function MapWrapper() {
  return (
    <div className="w-full h-[360px] rounded-2xl overflow-hidden shadow">
      <Heatmap />
      <Clusters />
    </div>
  );
}
