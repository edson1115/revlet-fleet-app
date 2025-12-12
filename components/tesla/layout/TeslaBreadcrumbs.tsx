"use client";

import { usePathname } from "next/navigation";

export default function TeslaBreadcrumbs() {
  const path = usePathname(); // /office/requests/123
  const parts = path.split("/").filter(Boolean);

  let build = "";
  const items = parts.map((p) => {
    build += "/" + p;
    return { label: p.replace(/-/g, " "), href: build };
  });

  return (
    <div className="text-sm text-gray-500 flex items-center gap-2">
      <a href="/" className="hover:text-black">Home</a>

      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <span>/</span>
          <a
            href={item.href}
            className="capitalize hover:text-black"
          >
            {item.label}
          </a>
        </span>
      ))}
    </div>
  );
}
