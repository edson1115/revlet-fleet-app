"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OfficeFlowHeader({
  backHref,
}: {
  backHref?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        {backHref && (
          <Link
            href={backHref}
            className="text-sm text-gray-600 hover:text-black transition"
          >
            ← Back
          </Link>
        )}

        <span className="text-sm text-gray-400">|</span>

        <button
          onClick={() => router.push("/office")}
          className="text-sm text-gray-600 hover:text-black transition"
        >
          Dashboard
        </button>
      </div>

      <div className="text-sm font-medium text-gray-700">
        Walk-In Service Request
      </div>
    </div>
  );
}
