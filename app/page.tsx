// app/page.tsx
"use client";
import Link from "next/link";
import { useMe } from "@/app/providers/UserContext";

export default function Home() {
  const me = useMe();
  const role = me.role ?? "UNKNOWN";

  const can = {
    admin: role === "ADMIN",
    office: role === "ADMIN" || role === "OFFICE",
    dispatch: role === "ADMIN" || role === "DISPATCH",
    tech: role === "ADMIN" || role === "TECH",
    customer: role === "CUSTOMER",
  };

  return (
    <main className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-6">
      {(can.customer || can.office) && <Tile href="/fm/requests/new" label="Create Service Request" />}
      {(can.office || can.admin) && <Tile href="/office" label="Office — NEW" />}
      {(can.dispatch || can.admin) && <Tile href="/dispatch/scheduled" label="Dispatch — Scheduled" />}
      {(can.tech || can.admin) && <Tile href="/tech/queue" label="Tech — In Progress" />}
      {can.admin && <Tile href="/admin" label="Admin" />}
    </main>
  );
}

function Tile({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-2xl border p-6 hover:shadow transition">
      <div className="text-lg font-medium">{label}</div>
    </Link>
  );
}
