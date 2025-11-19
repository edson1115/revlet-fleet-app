"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import SignInForm from "@/components/auth/SignInForm";

export default function LoginClient() {
  const sp = useSearchParams();
  const msg = sp.get("msg");

  useEffect(() => {
    if (msg === "signedout") toast.success("Signed out successfully!");
    if (msg === "error") toast.error("Sign-in failed. Please try again.");
  }, [msg]);

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <p className="text-sm text-gray-600 mb-6">
        Enter your work email and we’ll email you a magic link.
      </p>

      <SignInForm />
    </main>
  );
}
