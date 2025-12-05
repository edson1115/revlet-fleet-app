"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function RequestSubmittedPage() {
  const { id } = useParams();
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setFadeIn(true), 50);
  }, []);

  return (
    <div className="max-w-xl mx-auto p-10 text-center space-y-8">

      {/* CHECKMARK ANIMATION */}
      <div className={`transition-all duration-700 ${fadeIn ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
        <div className="mx-auto w-24 h-24 rounded-full bg-green-500 flex items-center justify-center">
          <svg
            className="w-14 h-14 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* TITLE */}
      <h1 className="text-3xl font-semibold tracking-tight">
        Request Submitted
      </h1>

      {/* SUBTEXT */}
      <p className="text-gray-600 text-sm max-w-sm mx-auto">
        Your service request has been successfully created. Our team will review it shortly.
      </p>

      {/* BUTTONS */}
      <div className="flex flex-col gap-3 mt-6">
        <Link
          href={`/customer/requests/${id}`}
          className="py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-900 transition"
        >
          View Request
        </Link>

        <Link
          href="/customer"
          className="py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
