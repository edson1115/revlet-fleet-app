"use client";

import { useSearchParams } from "next/navigation";

export default function ThanksClient() {
  const sp = useSearchParams();
  const id = sp.get("id");

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">
        Thanks! We received your request.
      </h1>

      <p className="text-gray-700">
        Our team will review it and reach out shortly.
        {id ? (
          <>
            {" "}
            Your confirmation number is{" "}
            <span className="font-mono">{id}</span>.
          </>
        ) : null}
      </p>

      <div className="mt-6">
        <a
          href="/"
          className="inline-block rounded border px-4 py-2 hover:bg-gray-50"
        >
          Back to home
        </a>
      </div>
    </main>
  );
}
