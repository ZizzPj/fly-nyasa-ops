"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/ops/flights", label: "Flight Schedules" },
  { href: "/ops/flights/seat-rate", label: "Seat Rate Flights" },
  { href: "/ops/flights/charter", label: "Charter Flights" },
];

function isActive(pathname: string, href: string) {
  if (href === "/ops/flights") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function FlightsSubnav() {
  const pathname = usePathname();

  return (
    <div className="dashboard-panel flex flex-wrap items-center gap-2 rounded-[24px] p-2">
      {ITEMS.map((item) => {
        const active = isActive(pathname ?? "/ops/flights", item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-[color:var(--brand)] text-white shadow-[0_10px_20px_rgba(10,59,68,0.15)]"
                : "text-[color:var(--ink-muted)] hover:bg-white hover:text-[color:var(--ink)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
