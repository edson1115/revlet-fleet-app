"use client";

interface TeslaStepperProps {
  steps: string[];
  current: number; // 1-based index
}

export function TeslaStepper({ steps, current }: TeslaStepperProps) {
  return (
    <div className="flex items-center justify-between w-full py-4 mb-6">
      {steps.map((step, index) => {
        const isActive = index + 1 === current;
        const isCompleted = index + 1 < current;

        return (
          <div
            key={index} // ✅ FIXED — added required key
            className="flex items-center flex-1"
          >
            {/* DOT */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold 
                ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-black text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
            >
              {index + 1}
            </div>

            {/* LABEL */}
            <div className="ml-2 text-sm font-medium">
              {step}
            </div>

            {/* LINE BETWEEN DOTS */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-[2px] mx-3 
                  ${isCompleted ? "bg-green-500" : "bg-gray-300"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
