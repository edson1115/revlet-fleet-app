"use client";

interface TeslaTimelineProps {
  status: string;
}

const STATUS_ORDER = [
  "NEW",
  "WAITING",
  "WAITING_FOR_APPROVAL",
  "WAITING_FOR_PARTS",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
];

export function TeslaTimeline({ status }: TeslaTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(status);

  return (
    <div className="w-full px-2 py-6">
      <div className="flex items-center justify-between relative">

        {STATUS_ORDER.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <div
              key={step}
              className="flex flex-col items-center flex-1 text-center"
            >
              {/* DOT */}
              <div
                className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center
                  transition-all duration-300
                  ${isCompleted ? "bg-green-500 border-green-500 text-white" : ""}
                  ${isActive ? "bg-black border-black text-white" : ""}
                  ${!isCompleted && !isActive ? "bg-gray-200 border-gray-400" : ""}
                `}
              >
                {/* Dot number */}
                <span className="text-[10px] font-semibold">
                  {index + 1}
                </span>
              </div>

              {/* Label */}
              <p
                className={`text-[10px] mt-2 font-medium ${
                  isCompleted || isActive ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {step.replace(/_/g, " ")}
              </p>

              {/* Connecting line */}
              {index < STATUS_ORDER.length - 1 && (
                <div
                  className={`
                    absolute top-[11px] h-[2px] 
                    ${isCompleted ? "bg-green-500" : "bg-gray-300"}
                  `}
                  style={{
                    left: `${(100 / (STATUS_ORDER.length - 1)) * index}%`,
                    width: `${100 / (STATUS_ORDER.length - 1)}%`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
