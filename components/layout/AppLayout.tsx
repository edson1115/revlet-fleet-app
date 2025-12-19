import AppHeader from "./AppHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="pt-6">{children}</main>
    </div>
  );
}
