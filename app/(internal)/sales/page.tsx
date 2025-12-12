import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import LeadsListClient from "./LeadsListClient";
import KPIs from "./KPIs";
import MapWrapper from "./Map/MapWrapper";

export default function SalesHome() {
  return (
    <TeslaLayoutShell title="Outside Sales">
      <div className="space-y-10 px-6 py-10">
        
        {/* KPI Summary */}
        <KPIs />

        {/* Map Section */}
        <MapWrapper />

        {/* Leads Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Active Leads</h2>
          <LeadsListClient />
        </div>
      </div>
    </TeslaLayoutShell>
  );
}
