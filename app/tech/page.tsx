"use client";

import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import Link from "next/link";
import { ClipboardCheck, Camera, Wrench } from "lucide-react";

export default function TechHomePage() {
  return (
    <TeslaLayoutShell>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
        Technician Dashboard
      </h1>

      <p className="text-gray-600 mt-1 mb-8">
        View and complete your assigned jobs.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        <Link
          href="/tech/queue"
          className="p-6 bg-white border rounded-2xl shadow-sm hover:shadow transition block"
        >
          <Wrench className="w-6 h-6 text-black" />
          <h2 className="text-lg font-semibold text-gray-900 mt-4">
            Assigned Jobs
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            View today’s assigned service jobs.
          </p>
        </Link>

        <Link
          href="/tech/completed"
          className="p-6 bg-white border rounded-2xl shadow-sm hover:shadow transition block"
        >
          <ClipboardCheck className="w-6 h-6 text-black" />
          <h2 className="text-lg font-semibold text-gray-900 mt-4">
            Completed Jobs
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Review completed service reports.
          </p>
        </Link>

      </div>
    </TeslaLayoutShell>
  );
}
