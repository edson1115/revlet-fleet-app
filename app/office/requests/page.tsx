import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import RequestListClient from "./RequestListClient";

export default function OfficeRequestsPage() {
  return (
    <TeslaLayoutShell>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
        All Requests
      </h1>

      <p className="text-gray-600 mt-1 mb-6">
        Search, filter, and manage all customer service requests.
      </p>

      <RequestListClient />
    </TeslaLayoutShell>
  );
}
