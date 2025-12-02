// app/page.tsx
import { redirect } from "next/navigation";
import { resolveUserScope } from "@/lib/api/scope";

export default async function Home() {
  const scope = await resolveUserScope();

  // Not logged in → login
  if (!scope.uid) return redirect("/login");

  // SUPERADMIN
  if (scope.role === "SUPERADMIN") {
    return redirect("/home");
  }

  // OFFICE
  if (scope.role === "OFFICE") {
    return redirect("/office");
  }

  // DISPATCH
  if (scope.role === "DISPATCH") {
    return redirect("/dispatch");
  }

  // TECHNICIAN
  if (scope.role === "TECH") {
    return redirect("/tech");
  }

  // CUSTOMER
  if (scope.role === "CUSTOMER" || scope.role === "CUSTOMER_USER") {
    return redirect("/portal");
  }

  // Unknown → login
  return redirect("/login");
}
