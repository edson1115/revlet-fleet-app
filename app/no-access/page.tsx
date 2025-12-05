// app/no-access/page.tsx
export default function NoAccess() {
  return (
    <main className="max-w-md mx-auto p-8 text-center">
      <h1 className="text-2xl font-semibold mb-2">You’re almost in</h1>
      <p className="text-neutral-600 mb-6">
        Your email is authenticated, but your account isn’t linked to a company yet.
      </p>
      <form method="POST" action="/api/admin/request-access">
        <button className="rounded-lg border px-4 py-2">Request Access</button>
      </form>
    </main>
  );
}



