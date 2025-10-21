// app/office/queue/page.tsx
import OfficeQueueClient from "./ui/OfficeQueueClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SP = Record<string, string | string[] | undefined>;

export default async function OfficeQueuePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const status = typeof sp?.status === "string" ? sp.status.toUpperCase() : "";
  return <OfficeQueueClient initialStatus={status} />;
}
