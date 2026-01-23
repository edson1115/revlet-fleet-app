"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Initialize Stripe outside render to avoid recreation
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function StripePaymentModal({ amount, onSuccess, onClose }: any) {
  const [clientSecret, setClientSecret] = useState("");

  // 1. On load, ask Backend for a "Client Secret" (Permission to charge)
  useState(() => {
    fetch("/api/stripe/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  });

  if (!clientSecret) return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-white">Initializing Secure Link...</div>;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-black font-bold">✕</button>
        
        <div className="mb-6">
            <h2 className="text-xl font-black text-zinc-900 uppercase italic">Secure Payment</h2>
            <p className="text-zinc-500 text-sm">Total Due: <span className="font-bold text-black">${amount.toFixed(2)}</span></p>
        </div>

        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm onSuccess={onSuccess} amount={amount} />
        </Elements>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: The Actual Form ---
function CheckoutForm({ onSuccess, amount }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
        setError(submitError.message || "Error");
        setLoading(false);
        return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href }, // Not used if redirect:if_required
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed");
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // ✅ SUCCESS! Now tell our database.
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <div className="text-red-600 text-xs font-bold bg-red-50 p-3 rounded">{error}</div>}
      
      <button 
        disabled={!stripe || loading} 
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 flex justify-center"
      >
        {loading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}