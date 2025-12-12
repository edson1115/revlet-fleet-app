// app/layout.tsx
import "./globals.css";
import { supabaseServer } from "@/lib/supabase/server";
import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";

export const metadata = {
  title: "Revlet",
  description: "Fleet Service Automation",
};

export default async function RootLayout({ children }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = null;

  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    role = String(prof?.role || "").toUpperCase();
  }

  // INTERNAL ROLES get full Tesla UI shell
  const INTERNAL = new Set([
    "SUPERADMIN",
    "ADMIN",
    "OFFICE",
    "DISPATCH",
    "TECH",
    "OUTSIDE_SALES",
  ]);

  const isInternal = INTERNAL.has(role);

  return (
    <html lang="en">
      <body>
        {isInternal ? (
          <TeslaLayoutShell>{children}</TeslaLayoutShell>
        ) : (
          // CUSTOMER / PUBLIC get clean layout without double headers
          <div className="bg-white min-h-screen">{children}</div>
        )}
      </body>
    </html>
  );
}
