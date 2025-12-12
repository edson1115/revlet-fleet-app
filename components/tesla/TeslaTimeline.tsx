"use client";

export function TeslaTimeline({ status }) {
  const steps = [
    "NEW",
    "WAITING",
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
  ];

  const currentIndex = steps.indexOf(status);

  return (
    <div className="flex items-center justify-between mt-6 mb-4">
      {steps.map((step, i) => {
        const active = i <= currentIndex;
        return (
          <div key={step} className="flex flex-col items-center w-full">
            <div
              className={`h-3 w-3 rounded-full ${
                active ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
            <span
              className={`text-xs mt-2 ${
                active ? "text-gray-900 font-medium" : "text-gray-400"
              }`}
            >
              {step.replaceAll("_", " ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
