"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/ops", label: "Command" },
  { href: "/ops/flights", label: "Flights" },
  { href: "/ops/reservations", label: "Reservations" },
  { href: "/ops/bookings", label: "Bookings" },
  { href: "/ops/rules", label: "Rules" },
  { href: "/ops/agents", label: "Agents" },
  { href: "/ops/airports", label: "Airports" },
  { href: "/ops/reports", label: "Reports" },
];

function isActive(pathname: string, href: string) {
  if (href === "/ops") return pathname === "/ops";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-[color:var(--brand)] text-white shadow-[0_10px_24px_rgba(10,59,68,0.18)]"
          : "text-[color:var(--ink-muted)] hover:bg-white/70 hover:text-[color:var(--ink)]"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

export function OpsNav() {
  const pathname = usePathname();
  const p = pathname ?? "/ops";

  return (
    <nav className="flex flex-col gap-3 lg:items-end">
      <div className="hidden flex-wrap items-center gap-2 xl:flex">
        {NAV.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={isActive(p, item.href)}
          />
        ))}
      </div>

      <Link
        href="/ops/reservations/new"
        className="button-primary rounded-full px-4 py-2.5 text-sm font-semibold"
      >
        New Reservation
      </Link>
    </nav>
  );
}
