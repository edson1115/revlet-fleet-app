"use client";

import { TeslaHomeCard } from "@/components/tesla/customer/TeslaHomeCard";

export default function CustomerHomePage() {
  return (
    <div className="px-6 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <TeslaHomeCard title="My Vehicles" href="/customer/vehicles" icon="🚗" />
        <TeslaHomeCard title="Service Requests" href="/customer/requests" icon="🛠" />
        <TeslaHomeCard title="New Request" href="/customer/requests/new" icon="➕" />
        <TeslaHomeCard title="My Profile" href="/customer/profile" icon="👤" />
      </div>
    </div>
  );
}
