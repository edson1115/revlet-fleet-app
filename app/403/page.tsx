// app/403/page.tsx

export default function AccessDenied() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">403</h1>
      <p className="text-gray-600 mt-2">
        You do not have permission to view this page.
      </p>
      <a
        href="/"
        className="mt-4 text-blue-600 underline hover:text-blue-800 transition"
      >
        Return Home
      </a>
    </div>
  );
}
