import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import OfficeQueueClient from "./OfficeQueueClient";

export default function OfficeQueuePage() {
  return (
    <TeslaLayoutShell>

      {/* PAGE TITLE */}
      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
        Office Queue
      </h1>

      {/* SUBTITLE */}
      <p className="text-gray-600 mt-1 mb-6">
        All incoming service requests that need review.
      </p>

      {/* CLIENT COMPONENT */}
      <OfficeQueueClient />
      
    </TeslaLayoutShell>
  );
}
