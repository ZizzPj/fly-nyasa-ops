"use client";

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
    <div className="flex flex-wrap items-center gap-2">
      {ITEMS.map((item) => {
        const active = isActive(pathname ?? "/ops/flights", item.href);

        return (
          <a
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-slate-900 text-white"
                : "border bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}