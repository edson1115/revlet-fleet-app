"use client";

import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ✅ This Shell already includes TeslaSidebar + TeslaTopBar
    <TeslaLayoutShell>
      {children}
    </TeslaLayoutShell>
  );
}