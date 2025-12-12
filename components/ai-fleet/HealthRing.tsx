"use client";
import React from "react";

export function HealthRing({ score }: { score: number }) {
  const pct = Math.min(Math.max(score, 0), 100);
  const angle = (pct / 100) * 360;

  return (
    <div className="relative h-48 w-48">
      <svg className="h-full w-full">
        <circle
          cx="96"
          cy="96"
          r="85"
          stroke="#e5e7eb"
          strokeWidth="14"
          fill="none"
        />
        <circle
          cx="96"
          cy="96"
          r="85"
          stroke="black"
          strokeWidth="14"
          fill="none"
          strokeDasharray={`${(angle / 360) * 535} 999`}
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-4xl font-bold">{pct}</p>
      </div>
    </div>
  );
}
