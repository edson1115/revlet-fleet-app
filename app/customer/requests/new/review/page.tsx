"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { TeslaStepper } from "@/components/tesla/TeslaStepper";
import { useNewRequest } from "@/hooks/useNewRequest";

// Your AI Hooks (placeholders for now)
import { useAISummary } from "@/hooks/useAISummary";
import { useAIParts } from "@/hooks/useAIParts";
import { useAINextService } from "@/hooks/useAINextService";
import { useAIProblemDetect } from "@/hooks/useAIProblemDetect";

export default function NewRequestReviewPage() {
  const router = useRouter();
  const { data, setAIResults } = useNewRequest();

  const [loading, setLoading] = useState(true);

  // AI Hook instances
  const summaryAI = useAISummary();
  const partsAI = useAIParts();
  const nextServiceAI = useAINextService();
  const problemDetectAI = useAIProblemDetect();

  // Combined AI Results for UI
  const [results, setResults] = useState({
    summary: "",
    parts: [],
    nextService: "",
    problemSummary: "",
  });

  useEffect(() => {
    async function runAI() {
      if (!data.photos || data.photos.length === 0) {
        router.push("/customer/requests/new/photos");
        return;
      }

      setLoading(true);

      // For demo, we analyze the *first* photo
      const firstPhoto = data.photos[0];

      const [summary, parts, nextService, problem] = await Promise.all([
        summaryAI.run(firstPhoto),
        partsAI.run(firstPhoto),
        nextServiceAI.run({}),
        problemDetectAI.run(firstPhoto),
      ]);

      const combined = {
        summary: summaryAI.result || "No summary available.",
        parts: parts?.parts || [],
        nextService: nextService?.nextService || "No prediction",
        problemSummary: problem?.summary || "No issues detected",
      };

      setResults(combined);
      setAIResults(combined);

      setLoading(false);
    }

    runAI();
  }, []);

  function handleNext() {
    router.push("/customer/requests/new/submit");
  }

  return (
    <div className="px-6 py-12 space-y-10">
      {/* STEPPER */}
      <TeslaStepper steps={["Photos", "AI Review", "Submit"]} current={2} />

      {/* MAIN BLOCK */}
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
        <h2 className="text-xl font-semibold">AI Review</h2>

        {loading ? (
          <div className="text-center py-10 text-gray-500 text-sm">
            🔄 Running AI analysis…
          </div>
        ) : (
          <div className="space-y-6">
            {/* SUMMARY */}
            <div>
              <h3 className="font-semibold text-gray-900">AI Summary</h3>
              <p className="text-sm text-gray-600 mt-1">{results.summary}</p>
            </div>

            {/* PROBLEM DETECT */}
            <div>
              <h3 className="font-semibold text-gray-900">Likely Issue</h3>
              <p className="text-sm text-gray-600 mt-1">
                {results.problemSummary}
              </p>
            </div>

            {/* PARTS */}
            <div>
              <h3 className="font-semibold text-gray-900">Suggested Parts</h3>
              {results.parts.length === 0 ? (
                <p className="text-sm text-gray-600 mt-1">No parts detected.</p>
              ) : (
                <ul className="list-disc ml-5 text-sm text-gray-600 mt-1">
                  {results.parts.map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* NEXT SERVICE */}
            <div>
              <h3 className="font-semibold text-gray-900">Next Service</h3>
              <p className="text-sm text-gray-600 mt-1">{results.nextService}</p>
            </div>
          </div>
        )}
      </div>

      {/* NEXT BUTTON */}
      {!loading && (
        <button
          onClick={handleNext}
          className="w-full py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-900 transition"
        >
          Continue to Submit →
        </button>
      )}
    </div>
  );
}
