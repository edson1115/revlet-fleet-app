export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-6">{children}</main>
    </div>
  );
}
