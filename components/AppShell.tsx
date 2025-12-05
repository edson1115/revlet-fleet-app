// components/AppShell.tsx
"use client";

import { ReactNode } from "react";
import MainContainer from "./MainContainer";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#0A0A0A]">
      {/* TOP NAV (already injected by layout.tsx) */}
      <div className="pt-4">
        <MainContainer>
          <div className="animate-fade-in">{children}</div>
        </MainContainer>
      </div>
    </div>
  );
}



