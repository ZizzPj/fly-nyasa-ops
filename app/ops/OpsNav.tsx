"use client";

import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/ops", label: "Command" },
  { href: "/ops/flights", label: "Flights" },
  { href: "/ops/reservations", label: "Reservations" },
  { href: "/ops/bookings", label: "Bookings" },
  { href: "/ops/reports", label: "Reports" },
];


function isActive(pathname: string, href: string) {
  if (href === "/ops") return pathname === "/ops";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <a
      href={href}
      className={`rounded-md px-3 py-2 text-sm font-medium transition ${
        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </a>
  );
}

export function OpsNav() {
  const pathname = usePathname();
  const p = pathname ?? "/ops";

  return (
    <nav className="flex items-center gap-2">
      <div className="hidden items-center gap-1 sm:flex">
        {NAV.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={isActive(p, item.href)}
          />
        ))}
      </div>

      {/* Primary ops CTA: create reservation */}
      <a
        href="/ops/reservations/new"
        className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        + New Reservation
      </a>

    </nav>
  );
}
