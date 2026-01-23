import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia", // Use latest API version or "2023-10-16"
});

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    // 1. Create a PaymentIntent with the specified amount.
    // Stripe expects amounts in CENTS (e.g., $10.00 = 1000)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), 
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}