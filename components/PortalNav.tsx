"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function PortalNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (!pathname) return false;

    if (href === "/portal") return pathname === "/portal";

    if (href.startsWith("/portal/vehicles")) {
      return pathname.startsWith("/portal/vehicles");
    }

    if (href.startsWith("/portal/requests")) {
      return pathname.startsWith("/portal/requests");
    }

    if (href.startsWith("/portal/maintenance")) {
      return pathname.startsWith("/portal/maintenance");
    }

    if (href.startsWith("/portal/settings")) {
      return pathname.startsWith("/portal/settings");
    }

    return pathname === href;
  }

  const links = [
    { href: "/portal", label: "Dashboard" },
    { href: "/portal/vehicles", label: "Vehicles" },
    { href: "/portal/vehicles/new", label: "Add Vehicle" },
    { href: "/portal/requests", label: "Requests" },
    { href: "/portal/maintenance", label: "Maintenance" },
    { href: "/portal/settings", label: "Settings" },
    { href: "/portal/metrics", label: "Metrics" },
    { href: "/portal/performance", label: "Performance" },


  ];

  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/portal" className="text-sm font-semibold">
          Customer Portal
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={classNames(
                "whitespace-nowrap",
                isActive(l.href)
                  ? "font-semibold text-black"
                  : "text-gray-600 hover:text-black"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
