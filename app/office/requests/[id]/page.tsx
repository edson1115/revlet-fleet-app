"use client";

import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import OfficeRequestDetailClient from "./OfficeRequestDetailClient";

export default function OfficeRequestDetailPage({ params }: any) {
  return (
    <TeslaLayoutShell>
      <OfficeRequestDetailClient params={params} />
    </TeslaLayoutShell>
  );
}
