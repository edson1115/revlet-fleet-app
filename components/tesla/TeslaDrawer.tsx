"use client";

import { useEffect, useState } from "react";
import { TeslaStatusChip } from "./TeslaStatusChip";
import { TeslaTimeline } from "./TeslaTimeline";
import TeslaScheduleCard from "./TeslaScheduleCard";
import TeslaTechAssignCard from "./TeslaTechAssignCard";
import { TeslaPartsCard } from "./TeslaPartsCard";
import TeslaLaborCard from "./TeslaLaborCard";
import TeslaActionsRow from "./TeslaActionsRow";
import { TeslaDispatchActions } from "./TeslaDispatchActions";

export default function TeslaDrawer({
  requestId,
  onClose,
}: {
  requestId: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [techs, setTechs] = useState<any[]>([]);

  // -------------------------------------
  // Fetch Request + Techs
  // -------------------------------------
  async function loadAll() {
    setLoading(true);

    const [reqRes, techRes] = await Promise.all([
      fetch(`/api/requests/${requestId}`).then((r) => r.json()),
      fetch(`/api/techs`).then((r) => r.json()),
    ]);

    if (reqRes.ok) setRequest(reqRes.row);
    if (techRes.ok) setTechs(techRes.rows);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, [requestId]);

  if (loading || !request) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading request…
      </div>
    );
  }

  const r = request;

  return (
    <div className="w-full h-full overflow-y-auto bg-gray-50 p-6 space-y-8">

      {/* CLOSE BUTTON */}
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Close ✕
        </button>
      </div>

      {/* HEADER */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {r.service || "Service Request"}
        </h1>
        <TeslaStatusChip status={r.status} size="sm" />
      </div>

      {/* TIMELINE */}
      <TeslaTimeline
        created={r.created_at}
        scheduled={r.scheduled_start_at}
        preferredStart={r.preferred_start}
        preferredEnd={r.preferred_end}
        status={r.status}
      />

      {/* SCHEDULE CARD */}
      <TeslaScheduleCard
        request={r}
        techs={techs}
        onRefresh={loadAll}
      />

      {/* TECH ASSIGN (Tesla Style) */}
      <TeslaTechAssignCard
        request={r}
        techs={techs}
        onUpdate={(next) => {
          setRequest({ ...r, ...next });
          loadAll();
        }}
      />

      {/* PARTS */}
      <TeslaPartsCard
        parts={r.parts || []}
        setParts={(next) =>
          setRequest({ ...r, parts: next })
        }
      />

      {/* LABOR CARD (uses est_hours + actual_minutes) */}
      <TeslaLaborCard
        estHours={r.estimated_hours || 1}
        actualMinutes={r.actual_minutes || 0}
      />

      {/* DISPATCH EVENT ACTIONS */}
      <TeslaDispatchActions
        id={r.id}
        dispatched_at={r.dispatched_at}
        en_route_at={r.en_route_at}
        arrived_at={r.arrived_at}
        started_at={r.started_at}
        completed_at={r.completed_at}
        onUpdated={loadAll}
      />

      {/* ACTION ROW (Decline, Needs Review, Send to Tech) */}
      <TeslaActionsRow
        requestId={r.id}
        currentStatus={r.status}
        onAction={async () => loadAll()}
      />
    </div>
  );
}



