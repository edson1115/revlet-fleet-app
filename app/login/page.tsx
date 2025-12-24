"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function sendMagicLink(e: any) {
  e.preventDefault();

  const res = await fetch("/api/auth/magic-link", {
    method: "POST",
    body: JSON.stringify({
  email,
  next: "/office/requests", // canonical office home
}),

  });

  const js = await res.json();
  if (js.ok) setSent(true);
  else alert(js.error || "Error sending magic link");
}


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-xl p-10 w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-center">Login to Revlet</h1>

        {sent ? (
          <p className="text-center text-green-600">
            Magic link sent! Check your email.
          </p>
        ) : (
          <form onSubmit={sendMagicLink} className="space-y-4">
            <input
              type="email"
              className="w-full p-3 border rounded-lg"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button
              type="submit"
              className="w-full bg-black text-white p-3 rounded-lg hover:bg-gray-800"
            >
              Send Magic Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
