// components/auto-integrate/AiRecommendations.tsx
"use client";

import React from "react";

/**
 * Define the proper structure for AI recommendations.
 * Adjust this interface anytime the API changes.
 */
export interface AiRecommendationData {
  recommendedServices: string[];
  recommendedInspections: string[];
  recommendedParts: string[];
  summary: string;
}

export default function AiRecommendations({
  data,
}: {
  data: AiRecommendationData | null;
}) {
  if (!data) {
    return (
      <div className="rounded border p-3 bg-gray-50 text-gray-600 text-sm">
        No AI recommendations available.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border p-4 shadow-sm bg-white">
      <h2 className="text-lg font-semibold mb-3">AI Recommendations</h2>

      <div className="space-y-3 text-sm">
        <p>
          <b>Recommended Services:</b>{" "}
          {data.recommendedServices?.length
            ? data.recommendedServices.join(", ")
            : "None"}
        </p>

        <p>
          <b>Recommended Inspections:</b>{" "}
          {data.recommendedInspections?.length
            ? data.recommendedInspections.join(", ")
            : "None"}
        </p>

        <p>
          <b>Recommended Parts:</b>{" "}
          {data.recommendedParts?.length
            ? data.recommendedParts.join(", ")
            : "None"}
        </p>

        <p className="text-gray-700">
          <b>Summary:</b> {data.summary || "N/A"}
        </p>
      </div>
    </div>
  );
}
