import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing vehicle id" },
      { status: 400 }
    );
  }

  // TEMP MOCK DATA — replace later with real AI scan & service logs
  return NextResponse.json({
    ok: true,
    health: {
      status: "Attention",
      summary: "Routine maintenance recommended based on mileage.",
      recommendations: [
        "Oil Change (Due in 500 miles)",
        "Brake Inspection",
        "Tire Rotation",
        "Battery Test",
      ],
    },
  });
}
