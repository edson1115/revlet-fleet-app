import { NextRequest, NextResponse } from "next/server";
import { runAI } from "@/lib/ai/run";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      mileage,
      vehicle,
      lastOilChange,
      lastBrakeService,
      lastTireService,
      symptoms,
    } = body;

    const prompt = `
You are an automotive repair AI assistant. Based on the following inputs, generate a JSON response with recommendedServices, recommendedInspections, recommendedParts, and summary.

Mileage: ${mileage}
Vehicle: ${vehicle}
Last Oil Change: ${lastOilChange}
Last Brake Service: ${lastBrakeService}
Last Tire Service: ${lastTireService}
Symptoms: ${symptoms}

Respond ONLY in valid JSON with this structure:
{
  "recommendedServices": [],
  "recommendedInspections": [],
  "recommendedParts": [],
  "summary": ""
}
`;

    const aiResp = await runAI(prompt);

    if (!aiResp) {
      return NextResponse.json(
        { recommendations: [] },
        { status: 200 }
      );
    }

    // Safe JSON parsing
    let parsed: any = {};
    try {
      parsed = JSON.parse(aiResp);
    } catch {
      parsed = {};
    }

    return NextResponse.json(
      {
        recommendations: parsed.recommendations || [],
        recommendedServices: parsed.recommendedServices || [],
        recommendedInspections: parsed.recommendedInspections || [],
        recommendedParts: parsed.recommendedParts || [],
        summary: parsed.summary || "",
      },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("Recommendation error:", err);
    return NextResponse.json(
      { error: "Failed to process recommendations" },
      { status: 500 }
    );
  }
}
