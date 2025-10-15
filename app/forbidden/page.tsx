// app/forbidden/page.tsx
export default function Forbidden() {
  return (
    <main className="max-w-md mx-auto p-8 text-center">
      <h1 className="text-2xl font-semibold mb-2">Not allowed</h1>
      <p className="text-neutral-600">You don’t have permission to view this area.</p>
    </main>
  );
}
