// app/office/layout.tsx
import type { ReactNode } from "react";

export default function OfficeLayout({ children }: { children: ReactNode }) {
  // PURE layout wrapper: no redirects here.
  return (
    <div className="max-w-7xl mx-auto p-4">
      {children}
    </div>
  );
}
