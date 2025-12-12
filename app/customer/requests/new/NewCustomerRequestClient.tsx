"use client";

import { useState } from "react";

export default function NewCustomerRequestClient() {
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: any) {
    e.preventDefault();
    setSubmitting(true);

    const form = new FormData(e.target);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch("/api/customer/requests/new", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (res.ok) {
      window.location.href = "/customer/requests";
    } else {
      alert("Error submitting request.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium">Vehicle Plate</label>
        <input
          name="plate"
          className="mt-1 w-full border rounded-lg px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Issue Description</label>
        <textarea
          name="description"
          className="mt-1 w-full border rounded-lg px-3 py-2"
          rows={4}
          required
        />
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-black text-white rounded-lg"
      >
        {submitting ? "Submitting…" : "Submit Request"}
      </button>
    </form>
  );
}
