import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  // FIX: Initialize Stripe inside the handler to prevent build-time crashes.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover" as any, 
  });

  try {
    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    // 1. Fetch the request to get invoice details
    const { data: request, error } = await supabase
      .from("service_requests")
      .select("*, customer:customers(*)")
      .eq("id", requestId)
      .single();

    if (error || !request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (!request.invoice_grand_total || request.invoice_grand_total <= 0) {
      return NextResponse.json({ error: "Invalid invoice amount" }, { status: 400 });
    }

    // 2. Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(request.invoice_grand_total * 100), // Convert to cents
      currency: "usd",
      description: `Service Request #${requestId}`,
      metadata: {
        requestId: requestId,
        customerId: request.customer_id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (err: any) {
    console.error("Stripe Error:", err);
    return NextResponse.json(
      { error: err.message || "Payment initialization failed" },
      { status: 500 }
    );
  }
}