// app/office/page.tsx
import { redirect } from "next/navigation";

export default function OfficeIndex() {
  // Keep the pretty /office URL working by sending people to the queue
  redirect("/office/queue");
}
