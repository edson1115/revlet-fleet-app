// app/dispatch/scheduled/page.tsx
import ScheduledClient from "./ui/ScheduledClient";

export default function DispatchScheduledPage() {
  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dispatch — Scheduled</h1>
      <ScheduledClient />
    </div>
  );
}
