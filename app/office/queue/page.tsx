// app/office/queue/page.tsx
import OfficeQueueClient from "./ui/OfficeQueueClient";

export const dynamic = "force-dynamic";

export default function OfficeQueuePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const status = typeof searchParams?.status === "string" ? searchParams!.status : "";
  return <OfficeQueueClient initialStatus={status.toUpperCase()} />;
}
