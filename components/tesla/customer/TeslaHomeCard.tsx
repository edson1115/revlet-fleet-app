"use client";

import Link from "next/link";

export function TeslaHomeCard({
  title,
  href,
  icon,
}: {
  title: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition shadow-sm"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h2 className="text-lg font-semibold tracking-tight text-gray-900">
        {title}
      </h2>
      <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-700">
        View details →
      </p>
    </Link>
  );
}
