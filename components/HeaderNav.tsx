// components/HeaderNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "@/lib/useMe";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`px-2 py-1 rounded ${active ? "font-semibold underline" : "hover:underline"}`}
    >
      {children}
    </Link>
  );
}

export default function HeaderNav() {
  const { perms, role, me } = useMe();
  // Defensive: show nothing until perms loaded (prevents flash)
  if (!perms) return null;

  // Desired order:
  // Create Request / Office Queue / Dispatch / Tech / Admin / Reports
  return (
    <div className="flex items-center gap-4">
      {/* Create Request (VIEWER/OFFICE/DISPATCH/SUPERADMIN) */}
      {perms.canSeeCreateRequest && <NavLink href="/fm/requests/new">Create Request</NavLink>}

      {/* Office Queue (DISPATCH read-only; OFFICE full; SUPERADMIN full) */}
      {(perms.canSeeOffice || role === "SUPERADMIN") && <NavLink href="/office/queue">Office Queue</NavLink>}

      {/* Dispatch (DISPATCH + SUPERADMIN) */}
      {(perms.canSeeDispatch || role === "SUPERADMIN") && <NavLink href="/dispatch">Dispatch</NavLink>}

      {/* Tech (TECH + DISPATCH + SUPERADMIN may view) */}
      {(perms.canSeeTech || role === "SUPERADMIN") && <NavLink href="/tech">Tech</NavLink>}

      {/* Admin (SUPERADMIN only for now) */}
      {role === "SUPERADMIN" && <NavLink href="/admin">Admin</NavLink>}

      {/* Reports (everyone can visit; content gated later) */}
      <NavLink href="/reports">Reports</NavLink>

      <div className="ml-auto text-sm text-gray-600">
        {me?.email} • {role}
      </div>
    </div>
  );
}



