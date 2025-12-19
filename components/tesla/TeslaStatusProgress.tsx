"use client";

const FLOW = [
  "NEW",
  "WAITING",
  "TO_BE_SCHEDULED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
];

export function TeslaStatusProgress({
  status,
}: {
  status: string;
}) {
  const currentIndex = FLOW.indexOf(status);

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      {FLOW.map((step, i) => {
        const active = i <= currentIndex;

        return (
          <span
            key={step}
            className={`text-xs font-medium px-3 py-1 rounded-full border
              ${
                active
                  ? "bg-black text-white border-black"
                  : "bg-gray-100 text-gray-400 border-gray-200"
              }
            `}
          >
            {step.replace(/_/g, " ")}
          </span>
        );
      })}
    </div>
  );
}
