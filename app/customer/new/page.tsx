"use client";

import { useState } from "react";

export default function NewCustomerPage() {
  const [name, setName] = useState("");

  async function create() {
    await fetch("/api/customers/create", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    alert("Customer created.");
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">New Customer</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Customer Name"
        className="border rounded p-2 w-full"
      />

      <button
        onClick={create}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Create
      </button>
    </div>
  );
}



