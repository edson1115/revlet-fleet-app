// app/tech/dispatch/page.tsx
import { redirect } from "next/navigation";

export default function TechDispatchAlias() {
  // Reuse the existing Dispatch screen at /dispatch
  redirect("/dispatch");
}
