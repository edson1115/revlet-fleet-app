export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex justify-center bg-[#F5F5F5]">
      <main className="w-full max-w-4xl px-10 py-12">
        {children}
      </main>
    </div>
  );
}
