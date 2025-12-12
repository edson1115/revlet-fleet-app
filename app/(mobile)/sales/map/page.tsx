"use client";

import dynamic from "next/dynamic";

const MobileSalesMap = dynamic(
  () => import("@/components/mobile/sales/map/MobileSalesMap"),
  { ssr: false }
);

export default function MobileSalesMapPage() {
  return (
    <div className="w-full h-screen">
      <MobileSalesMap />
    </div>
  );
}
