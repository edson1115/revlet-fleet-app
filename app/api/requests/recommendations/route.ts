// app/api/requests/recommendations/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * TEMPORARY BUILD-SAFE RECOMMENDATIONS ROUTE
 *
 * This version prevents Vercel build failures caused by missing OPENAI_API_KEY.
 * It does NOT call OpenAI and does NOT import any AI libraries.
 *
 * When you're ready to enable AI, replace this file with the original version.
 */

export async function POST(req: NextRequest) {
  try {
    // Return a safe placeholder (prevents build from crashing on Vercel)
    return NextResponse.json(
      {
        recommendations: [],
        recommendedServices: [],
        recommendedInspections: [],
        recommendedParts: [],
        summary: "AI recommendations temporarily disabled.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Recommendation route error:", err);
    return NextResponse.json(
      { error: "Failed to process recommendations" },
      { status: 500 }
    );
  }
}
