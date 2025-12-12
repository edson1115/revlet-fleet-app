"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";

export default function LeadNewPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    company_name: "",
    phone: "",
    notes: "",
  });

  function set(key: string, val: string) {
    setForm((x) => ({ ...x, [key]: val }));
  }

  async function submit() {
    await fetch("/api/outside-sales/leads/new", {
      method: "POST",
      body: JSON.stringify(form),
    });
    router.push("/outside-sales/leads");
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <TeslaHeroBar title="New Lead" subtitle="Add a prospect" />

      <div className="max-w-5xl mx-auto p-6">
        <TeslaSection label="Lead Information">
          <div className="space-y-4 text-sm">
            <input
              className="w-full bg-gray-100 rounded-lg px-3 py-2"
              placeholder="Customer Name"
              value={form.customer_name}
              onChange={(e) => set("customer_name", e.target.value)}
            />

            <input
              className="w-full bg-gray-100 rounded-lg px-3 py-2"
              placeholder="Customer Email"
              value={form.customer_email}
              onChange={(e) => set("customer_email", e.target.value)}
            />

            <input
              className="w-full bg-gray-100 rounded-lg px-3 py-2"
              placeholder="Company Name"
              value={form.company_name}
              onChange={(e) => set("company_name", e.target.value)}
            />

            <input
              className="w-full bg-gray-100 rounded-lg px-3 py-2"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />

            <textarea
              rows={4}
              className="w-full bg-gray-100 rounded-lg px-3 py-2"
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <button
            onClick={submit}
            className="mt-6 w-full py-2 bg-black text-white rounded-lg"
          >
            Save Lead
          </button>
        </TeslaSection>
      </div>
    </div>
  );
}
