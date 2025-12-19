import DispatcherRequestDetailClient from "./DispatcherRequestDetailClient";

export const dynamic = "force-dynamic";

export default function DispatcherRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <DispatcherRequestDetailClient requestId={params.id} />;
}
