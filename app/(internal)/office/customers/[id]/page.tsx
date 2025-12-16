"use client";

import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import OfficeCustomerDetailClient from "./OfficeCustomerDetailClient";

export default function OfficeCustomerDetailPage({ params }: any) {
  return (
    <TeslaLayoutShell>
      <OfficeCustomerDetailClient params={params} />
    </TeslaLayoutShell>
  );
}
