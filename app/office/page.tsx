// app/office/page.tsx
import { InviteUserButton } from "@/components/InviteUserButton";
import { redirect } from "next/navigation";

export default function OfficeIndex() {
  // Keep the pretty /office URL working by sending people to the queue
  redirect("/office/queue");
}
<div className="flex items-center justify-between mb-4">
  <h1 className="text-2xl font-semibold">Office Queue</h1>
  <InviteUserButton />
</div>
