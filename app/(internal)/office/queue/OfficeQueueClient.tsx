"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaRequestCard } from "@/components/tesla/TeslaRequestCard";

type QueueRequest = {
  id: string;
  type: string;
  status: string;
  service?: string;
  urgent?: boolean;
  po?: string;
  created_at: string;

  customer?: {
    name?: string;
  };

  vehicle?: {
    year?: number;
    make?: string;
    model?: string;
    plate?: string;
    unit_number?: string;
  };
};

export default function OfficeQueueClient() {
  const router = useRouter();
  const [rows, setRows] = useState<QueueRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadQueue() {
    setLoading(true);
    try {
      const res = await fetch("/api/office/queue", {
        cache: "no-store",
        credentials: "include",
      });

      const js = await res.json();
      if (js.ok) {
        setRows(js.rows || []);
      } else {
        console.error("Queue load failed:", js.error);
      }
    } catch (err) {
      console.error("Office queue error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Office Queue</h1>
        <p className="text-sm text-gray-500">
          Requests waiting for office review
        </p>
      </div>

      <TeslaSection>
        {loading && (
          <div className="p-6 text-sm text-gray-500">
            Loading queue…
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="p-6 text-sm text-gray-500">
            No requests waiting for office review.
          </div>
        )}

        <div className="space-y-4">
          {rows.map((req) => {
            const v = req.vehicle;

            // OFFICE SERVICE NAME WINS
            const title =
              req.service ||
              req.type ||
              "Service Request";

            const vehicleLine = v
              ? `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim()
              : null;

            const unitOrPlate =
              v?.unit_number
                ? `Unit ${v.unit_number}`
                : v?.plate
                ? `Plate ${v.plate}`
                : null;

            const subtitle = [vehicleLine, unitOrPlate]
              .filter(Boolean)
              .join(" • ");

            return (
              <TeslaRequestCard
                key={req.id}
                title={title}
                subtitle={subtitle}
                status={req.status}
                urgent={req.urgent}
                po={req.po}
                createdAt={req.created_at}
                customer={req.customer?.name}
                onClick={() =>
                  router.push(`/office/requests/${req.id}`)
                }
              />
            );
          })}
        </div>
      </TeslaSection>
    </div>
  );
}
