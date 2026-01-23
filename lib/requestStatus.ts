export type RequestStatus =
  | "NEW"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "WAITING_APPROVAL" 
  | "COMPLETED"
  | "ATTENTION_REQUIRED"
  | "CANCELED"
  | "READY_TO_SCHEDULE"
  | "RESCHEDULE_PENDING"; // ✅ Added for Hot Potato Workflow

export const REQUEST_STATUS: Record<
  string,
  { label: string; description: string; bg: string; text: string; dot: string; pulse?: boolean; tone?: string }
> = {
  NEW: {
    label: "New",
    description: "Unassigned / awaiting action",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    tone: "amber"
  },
  SCHEDULED: {
    label: "Scheduled",
    description: "Work scheduled",
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
    tone: "zinc"
  },
  IN_PROGRESS: {
    label: "In Progress",
    description: "Work currently underway",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    pulse: true,
    tone: "blue"
  },
  WAITING_APPROVAL: {
    label: "Approval Needed",
    description: "Waiting for customer approval",
    bg: "bg-orange-50",
    text: "text-orange-700",
    dot: "bg-orange-500",
    tone: "amber"
  },
  READY_TO_SCHEDULE: {
    label: "Ready",
    description: "Approved. Ready for Dispatch.",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
    tone: "blue"
  },
  // ✅ NEW: The "Hot Potato" Status
  RESCHEDULE_PENDING: { 
    label: "Reschedule Needed", 
    description: "Tech unable to complete. Needs new time.",
    bg: "bg-red-100", 
    text: "text-red-700", 
    dot: "bg-red-600",
    pulse: true, // Urgent pulsing effect
    tone: "red"
  },
  COMPLETED: {
    label: "Completed",
    description: "Work completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    tone: "emerald"
  },
  ATTENTION_REQUIRED: {
    label: "Needs Attention",
    description: "Blocked / needs review",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    tone: "red"
  },
  CANCELED: {
    label: "Canceled",
    description: "Request canceled",
    bg: "bg-zinc-100",
    text: "text-zinc-500",
    dot: "bg-zinc-400",
    tone: "zinc"
  },
};

export type RequestStatusKey = keyof typeof REQUEST_STATUS;