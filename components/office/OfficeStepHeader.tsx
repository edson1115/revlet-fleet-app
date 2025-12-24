"use client";

import { useRouter } from "next/navigation";

export default function OfficeStepHeader({
  backHref = "/office",
  title,
}: {
  backHref?: string;
  title: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={() => router.push(backHref)}
        className="text-sm text-gray-600 hover:text-black"
      >
        ← Back
      </button>

      <h1 className="text-xl font-semibold">{title}</h1>

      <button
        onClick={() => router.push("/office")}
        className="text-sm text-gray-600 hover:text-black"
      >
        Dashboard
      </button>
    </div>
  );
}
