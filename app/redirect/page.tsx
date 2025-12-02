// app/redirect/page.tsx
import { redirect } from "next/navigation";
import { resolveUserScope } from "@/lib/api/scope";

export default async function RedirectPage() {
  const scope = await resolveUserScope();

  if (!scope.uid) return redirect("/login");

  switch (scope.role) {
    case "SUPERADMIN":
      return redirect("/home");

    case "ADMIN":
    case "OFFICE":
      return redirect("/office");

    case "DISPATCH":
      return redirect("/dispatch");

    case "TECH":
      return redirect("/tech");

    case "CUSTOMER":
    case "CUSTOMER_USER":
      return redirect("/portal");

    default:
      return redirect("/login");
  }
}
