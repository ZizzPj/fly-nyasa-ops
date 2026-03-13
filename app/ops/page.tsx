import Link from "next/link";
import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge, statusTone } from "@/components/ui/Badge";
import { routeLabel } from "@/lib/format/routeLabel";
import { PageHeader } from "@/components/ui/PageHeader";

type FlightRow = {
  flight_id: string;
  flight_number: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  flight_status: string | null;
  departure_airport_name: string;
  via_airport_name: string | null;
  arrival_airport_name: string;
  seats_available: number | null;
  seats_held: number | null;
  seats_confirmed: number | null;
  seats_blocked: number | null;
};

type BookingRow = {
  booking_id: string;
  booking_type: string | null;
  status: string | null;
  flight_number: string | null;
  created_at: string | null;
};

type RuleRow = {
  id: string;
  name: string;
};

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function flightStatusLabel(status: string | null | undefined) {
  const s = (status ?? "").toUpperCase();
  if (s === "OPEN") return "Confirmed";
  if (s === "DEPARTED") return "Ticketed";
  if (s === "CANCELLED") return "Cancelled";
  return status ?? "—";
}

export default async function OpsPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const { data: flights } = await supabase
    .from("v_operational_flights_display")
    .select("*")
    .order("departure_time", { ascending: true });

  const { data: bookings } = await supabase
    .from("v_booking_operations_enriched")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: rules } = await supabase
    .from("flight_rules")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(8);

  const flightRows = (flights ?? []) as FlightRow[];
  const bookingRows = (bookings ?? []) as BookingRow[];
  const ruleRows = (rules ?? []) as RuleRow[];

  const totalFlights = flightRows.length;
  const confirmedFlights = flightRows.filter((f) => (f.flight_status ?? "").toUpperCase() === "OPEN").length;
  const totalAvailableSeats = flightRows.reduce((sum, f) => sum + (f.seats_available ?? 0), 0);
  const activeBookings = bookingRows.filter((b) => {
    const s = (b.status ?? "").toUpperCase();
    return s === "RESERVED" || s === "TICKETED";
  }).length;
  const reservedSeats = flightRows.reduce((sum, f) => sum + (f.seats_held ?? 0), 0);
  const seatLoad = totalAvailableSeats + reservedSeats === 0
    ? 0
    : Math.round((reservedSeats / (totalAvailableSeats + reservedSeats)) * 100);
  const nextDeparture = flightRows.find((f) => f.departure_time)?.departure_time ?? null;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Command"
        title="Operations command center"
        subtitle="Live commercial and inventory posture for the reservation operation. Prioritize upcoming departures, booking throughput, and rule coverage from one surface."
        actions={
          <>
            <Link href="/ops/reports" className="button-secondary rounded-full px-4 py-2 text-sm font-semibold">
              Open reports
            </Link>
            <Link href="/ops/flights/new" className="button-primary rounded-full px-4 py-2 text-sm font-semibold">
              Create flight
            </Link>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="dashboard-panel-strong rounded-[32px] px-6 py-6">
          <div className="eyebrow text-[11px] font-semibold text-white/60">Flight readiness</div>
          <div className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.04em]">
            Next departure {nextDeparture ? fmt(nextDeparture) : "awaiting schedule"}
          </div>
          <div className="mt-3 max-w-2xl text-sm text-white/70">
            {confirmedFlights} confirmed flights are open for sale with {totalAvailableSeats} seats still available across the active schedule.
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <HeroMetric label="Open flights" value={String(confirmedFlights)} />
            <HeroMetric label="Seat load" value={`${seatLoad}%`} />
            <HeroMetric label="Live bookings" value={String(activeBookings)} />
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <StatCard title="Total flights" value={String(totalFlights)} detail="Operational instances visible in the control deck." />
          <StatCard title="Available seats" value={String(totalAvailableSeats)} detail="Inventory remaining before holds and ticketing." />
          <StatCard title="Reserved seats" value={String(reservedSeats)} detail="Held capacity that needs active conversion or release." />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          title="Upcoming Flights"
          subtitle="Operational flights and live seat status."
          right={
            <Link href="/ops/flights" className="button-secondary rounded-full px-4 py-2 text-sm font-semibold">
              View flights
            </Link>
          }
        >
          {flightRows.length === 0 ? (
            <div className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-6 text-sm text-[color:var(--ink-muted)]">
              No flights found.
            </div>
          ) : (
            <div className="space-y-3">
              {flightRows.slice(0, 8).map((f) => (
                <div key={f.flight_id} className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold tracking-[-0.03em]">{f.flight_number ?? f.flight_id}</div>
                      <div className="mt-1 text-sm text-[color:var(--ink-muted)]">
                        {routeLabel({
                          departure_airport_name: f.departure_airport_name,
                          via_airport_name: f.via_airport_name,
                          arrival_airport_name: f.arrival_airport_name,
                        })}
                      </div>
                      <div className="mt-1 text-xs text-[color:var(--ink-muted)]">
                        Departure: {fmt(f.departure_time)}
                      </div>
                    </div>
                    <Badge tone={statusTone(f.flight_status)}>{flightStatusLabel(f.flight_status)}</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <FlightStat label="Avail" value={f.seats_available ?? 0} />
                    <FlightStat label="Held" value={f.seats_held ?? 0} />
                    <FlightStat label="Ticketed" value={f.seats_confirmed ?? 0} />
                    <FlightStat label="Blocked" value={f.seats_blocked ?? 0} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Recent Bookings"
          subtitle="Latest reservations and ticketing activity."
          right={
            <Link href="/ops/bookings" className="button-secondary rounded-full px-4 py-2 text-sm font-semibold">
              View bookings
            </Link>
          }
        >
          {bookingRows.length === 0 ? (
            <div className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-6 text-sm text-[color:var(--ink-muted)]">
              No bookings found.
            </div>
          ) : (
            <div className="space-y-3">
              {bookingRows.map((b) => (
                <div key={b.booking_id} className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold tracking-[-0.03em]">{b.booking_id}</div>
                      <div className="mt-1 text-sm text-[color:var(--ink-muted)]">
                        {b.booking_type ?? "—"} · {b.flight_number ?? "—"}
                      </div>
                      <div className="mt-1 text-xs text-[color:var(--ink-muted)]">
                        Created: {fmt(b.created_at)}
                      </div>
                    </div>
                    <Badge tone={statusTone(b.status)}>{b.status ?? "—"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          title="Active Rules"
          subtitle="Operational flight rules currently configured."
          right={
            <Link href="/ops/rules" className="button-secondary rounded-full px-4 py-2 text-sm font-semibold">
              Manage rules
            </Link>
          }
        >
          {ruleRows.length === 0 ? (
            <div className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-6 text-sm text-[color:var(--ink-muted)]">
              No active rules found.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {ruleRows.map((r) => (
                <div key={r.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4">
                  <div className="eyebrow text-[10px] font-semibold text-[color:var(--ink-muted)]">Rule</div>
                  <div className="mt-2 font-medium">{r.name}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Quick Actions" subtitle="Common operations">
          <div className="grid gap-3">
            <QuickLink href="/ops/reservations/new/seat" title="New Seat Reservation" subtitle="Reserve passenger seats on an operational flight." />
            <QuickLink href="/ops/reservations/new/charter" title="New Charter Reservation" subtitle="Reserve the full aircraft and block passenger inventory." />
            <QuickLink href="/ops/reports" title="Open Reports" subtitle="Review exports, holds health, and the current operations snapshot." />
            <QuickLink href="/ops/rules" title="Manage Rules" subtitle="Maintain operational flight rules used across the system." />
          </div>
        </Card>
      </div>
    </section>
  );
}

function StatCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="dashboard-panel rounded-[26px] p-5">
      <div className="eyebrow text-[11px] font-semibold text-[color:var(--ink-muted)]">{title}</div>
      <div className="metric-value mt-3 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--ink)]">{value}</div>
      <div className="mt-2 text-sm text-[color:var(--ink-muted)]">{detail}</div>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4">
      <div className="eyebrow text-[10px] font-semibold text-white/50">{label}</div>
      <div className="metric-value mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">{value}</div>
    </div>
  );
}

function FlightStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[rgba(16,33,50,0.04)] px-3 py-3">
      <div className="eyebrow text-[10px] font-semibold text-[color:var(--ink-muted)]">{label}</div>
      <div className="metric-value mt-1 text-base font-semibold text-[color:var(--ink)]">{value}</div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="rounded-[24px] border border-[color:var(--border)] bg-white/72 p-4 transition hover:bg-white">
      <div className="font-semibold tracking-[-0.02em]">{title}</div>
      <div className="mt-1 text-sm text-[color:var(--ink-muted)]">{subtitle}</div>
    </Link>
  );
}
