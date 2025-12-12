"use client";

import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import RequestDetailClient from "./RequestDetailClient";

export default function CustomerRequestDetailWrapper({ params }: any) {
  return (
    <TeslaLayoutShell>
      <RequestDetailClient params={params} />
    </TeslaLayoutShell>
  );
}
