"use client";

import { useParams, useRouter } from "next/navigation";
import OfficeRequestDetailClient from "./OfficeRequestDetailClient";
import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";

export default function OfficeRequestPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  if (!params?.id) {
    return <div className="p-6 text-gray-500">Invalid request</div>;
  }

  return (
    <TeslaLayoutShell>
      <OfficeRequestDetailClient />
    </TeslaLayoutShell>
  );
}
