"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OfficeRequestRow from "./OfficeRequestRow";

export default function OfficeQueueClient() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/office/requests", {
        credentials: "include",
        cache: "no-store",
      });

      const js = await res.json();
      setRequests(js.requests || []);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading queue…</div>;
  }

  if (!requests.length) {
    return <div className="p-6 text-sm text-gray-500">No requests in queue.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-3 px-6">
      {requests.map((r) => (
        <OfficeRequestRow
          key={r.id}
          request={r}
          onClick={() => router.push(`/office/requests/${r.id}`)}
        />
      ))}
    </div>
  );
}
