"use client";

import { useEffect, useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

import BulkTireOrderClient from "./BulkTireOrderClient";

export default function TireOrderPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <TeslaHeroBar
        title="Bulk Tire Order"
        subtitle="Order tires for multiple vehicles"
      />

      <div className="max-w-4xl mx-auto p-6 space-y-10">
        <BulkTireOrderClient />
      </div>
    </div>
  );
}
