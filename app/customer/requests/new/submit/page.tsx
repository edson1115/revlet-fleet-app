"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { TeslaStepper } from "@/components/tesla/TeslaStepper";
import { useNewRequest } from "@/hooks/useNewRequest";

export default function NewRequestSubmitPage() {
  const router = useRouter();
  const { data, clear } = useNewRequest();

  const [loading, setLoading] = useState(false);

  // Protect page if wizard not complete
  useEffect(() => {
    if (!data.photos || data.photos.length === 0) {
      router.push("/customer/requests/new/photos");
      return;
    }
    if (!data.ai || !data.ai.summary) {
      router.push("/customer/requests/new/review");
      return;
    }
  }, []);

  async function handleSubmit() {
    try {
      setLoading(true);

      const res = await fetch("/api/customer/requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: data.vehicle_id,
          service_type: data.service_type,
          description: data.description,
          image_urls: data.photos,
          ai_summary: data.ai.summary,
          ai_parts: data.ai.parts,
          ai_problem: data.ai.problemSummary,
          ai_next_service: data.ai.nextService,
        }),
      });

      const js = await res.json();
      setLoading(false);

      if (!js.ok) {
        alert("Error creating request: " + js.error);
        return;
      }

      // Clear wizard state
      clear();

      // Redirect to confirmation page
      router.push(`/customer/requests/submitted/${js.id}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Unexpected error submitting request.");
    }
  }

  return (
    <div className="px-6 py-12 space-y-10">
      {/* Stepper */}
      <TeslaStepper steps={["Photos", "AI Review", "Submit"]} current={3} />

      {/* Confirm Block */}
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-5">
        <h2 className="text-xl font-semibold">Submit Your Request</h2>

        <p className="text-gray-600 text-sm">
          AI analysis is complete. When you submit, the Revlet Team will review
          your request and reach out shortly.
        </p>

        {/* Summary of User Inputs */}
        <div className="bg-gray-50 p-4 rounded-xl text-sm space-y-2 border">
          <p>
            <span className="font-semibold">Vehicle:</span>{" "}
            {data.vehicle_label || "Not selected"}
          </p>

          <p>
            <span className="font-semibold">Service:</span>{" "}
            {data.service_type || "General Service"}
          </p>

          <p>
            <span className="font-semibold">Description:</span>{" "}
            {data.description || "No description provided"}
          </p>

          <p>
            <span className="font-semibold">Photos:</span>{" "}
            {data.photos?.length} uploaded
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-black text-white font-medium 
          hover:bg-gray-900 transition disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </div>
  );
}
