// app/portal/layout.tsx
"use client";

import NotificationBell from "@/components/portal/NotificationBell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white p-4 flex items-center justify-between">
        <div className="text-xl font-semibold">Customer Portal</div>
        <NotificationBell />
      </div>

      <div>{children}</div>
    </div>
  );
}
