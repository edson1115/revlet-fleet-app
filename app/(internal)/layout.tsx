import { LocationScopeProvider } from "@/lib/useLocationScope";

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocationScopeProvider>
      {children}
    </LocationScopeProvider>
  );
}



