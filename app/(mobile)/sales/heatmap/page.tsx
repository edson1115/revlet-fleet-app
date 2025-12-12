"use client";

import dynamic from "next/dynamic";

const MobileSalesHeatmap = dynamic(
  () => import("@/components/mobile/sales/map/MobileSalesHeatmap"),
  { ssr: false }
);

export default function SalesHeatmapPage() {
  return <MobileSalesHeatmap />;
}
