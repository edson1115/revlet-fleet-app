// components/layout/TeslaPageLayout.tsx
"use client";

import { ReactNode } from "react";
import TopBar from "@/components/layout/TopBar";

export default function TeslaPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <main className="pt-6">{children}</main>
    </div>
  );
}
