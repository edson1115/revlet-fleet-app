import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import OfficeCustomersClient from "./OfficeCustomersClient";

export default function OfficeCustomersPage() {
  return (
    <TeslaLayoutShell>
      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
        Customers
      </h1>

      <p className="text-gray-600 mt-1 mb-6">
        Manage customer accounts and fleet profiles.
      </p>

      <OfficeCustomersClient />
    </TeslaLayoutShell>
  );
}
