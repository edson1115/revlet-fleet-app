// app/portal/layout.tsx
import type { ReactNode } from "react";
import PortalNav from "@/components/PortalNav";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <PortalNav />
      <div className="p-4">{children}</div>
    </div>
  );
}
