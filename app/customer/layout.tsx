// app/customer/layout.tsx
import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";

export default function CustomerLayout({ children }) {
  return (
    <TeslaLayoutShell>
      {children}
    </TeslaLayoutShell>
  );
}
