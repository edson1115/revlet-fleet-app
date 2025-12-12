import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";

export default function CustomerLayout({ children }) {
  return (
    <TeslaLayoutShell>
      {children}
    </TeslaLayoutShell>
  );
}
