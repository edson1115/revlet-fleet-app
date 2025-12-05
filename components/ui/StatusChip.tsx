"use client";

type Status =
  | "NEW"
  | "WAITING_TO_BE_SCHEDULED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "WAITING_PARTS"
  | "WAITING_APPROVAL"
  | "COMPLETED"
  | "CANCELLED";

const STYLES: Record<
  Status,
  { bg: string; border: string; text: string }
> = {
  NEW: {
    bg: "bg-black",
    border: "border-black",
    text: "text-white",
  },
  WAITING_TO_BE_SCHEDULED: {
    bg: "bg-transparent",
    border: "border-[#F5A623]",
    text: "text-[#F5A623]",
  },
  SCHEDULED: {
    bg: "bg-transparent",
    border: "border-[#80FF44]",
    text: "text-black",
  },
  IN_PROGRESS: {
    bg: "bg-transparent",
    border: "border-[#A3A3A3]",
    text: "text-[#0A0A0A]",
  },
  WAITING_PARTS: {
    bg: "bg-transparent",
    border: "border-[#D0D0D0]",
    text: "text-[#555555]",
  },
  WAITING_APPROVAL: {
    bg: "bg-[#F5A623]",
    border: "border-[#F5A623]",
    text: "text-white",
  },
  COMPLETED: {
    bg: "bg-transparent",
    border: "border-[#E5E5E5]",
    text: "text-[#999999]",
  },
  CANCELLED: {
    bg: "bg-transparent",
    border: "border-[#FF3B30]",
    text: "text-[#FF3B30]",
  },
};

export default function StatusChip({ status }: { status: Status }) {
  const style = STYLES[status];

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-3 py-[3px]
        text-[11px] font-medium tracking-wide
        rounded-full border
        ${style.bg} ${style.border} ${style.text}
      `}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}



