"use client";

import React, { useEffect, useState } from "react";
import TimelineTechLane from "./TimelineTechLane";
import TimelineHeader from "./TimelineHeader";

type Block = {
  id: string;
  technician_id: string;
  start_at: string;
  end_at: string;
};

type Tech = {
  id: string;
  full_name?: string | null;
};

export default function TechTimeline({
  techs,
  blocks,
  onSelect,
}: {
  techs: Tech[];
  blocks: Block[];
  onSelect: (techId: string, start: string, end: string) => void;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full bg-white rounded-xl border p-4">
      {/* Header row */}
      <TimelineHeader />

      <div className="divide-y">
        {techs.map((tech) => (
          <TimelineTechLane
            key={tech.id}
            tech={tech}
            blocks={blocks.filter((b) => b.technician_id === tech.id)}
            now={now}
            onSelect={(range) =>
              onSelect(tech.id, range.start, range.end)
            }
          />
        ))}
      </div>
    </div>
  );
}



