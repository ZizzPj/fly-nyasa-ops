import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge, statusTone } from "@/components/ui/Badge";
import { routeLabel } from "@/lib/format/routeLabel";

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

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Command</div>
        <h1 className="mt-1 text-2xl font-semibold">Operations Command Center</h1>
        <div className="mt-1 text-sm text-slate-700">
          Real-time operational view of flights, reservations and booking control.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Flights" value={String(totalFlights)} />
        <StatCard title="Confirmed Flights" value={String(confirmedFlights)} />
        <StatCard title="Available Seats" value={String(totalAvailableSeats)} />
        <StatCard title="Active Bookings" value={String(activeBookings)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          title="Upcoming Flights"
          subtitle="Operational flights and live seat status."
          right={
            <a
              href="/ops/flights"
              className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              View Flights
            </a>
          }
        >
          {flightRows.length === 0 ? (
            <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
              No flights found.
            </div>
          ) : (
            <div className="space-y-3">
              {flightRows.slice(0, 8).map((f) => (
                <div key={f.flight_id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{f.flight_number ?? f.flight_id}</div>
                      <div className="mt-1 text-sm text-slate-700">
                        {routeLabel({
                          departure_airport_name: f.departure_airport_name,
                          via_airport_name: f.via_airport_name,
                          arrival_airport_name: f.arrival_airport_name,
                        })}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        Departure: {fmt(f.departure_time)}
                      </div>
                    </div>
                    <Badge tone={statusTone(f.flight_status)}>{flightStatusLabel(f.flight_status)}</Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-slate-700">
                    <div>Avail: {f.seats_available ?? 0}</div>
                    <div>Reserved: {f.seats_held ?? 0}</div>
                    <div>Ticketed: {f.seats_confirmed ?? 0}</div>
                    <div>Blocked: {f.seats_blocked ?? 0}</div>
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
            <a
              href="/ops/bookings"
              className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              View Bookings
            </a>
          }
        >
          {bookingRows.length === 0 ? (
            <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
              No bookings found.
            </div>
          ) : (
            <div className="space-y-3">
              {bookingRows.map((b) => (
                <div key={b.booking_id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{b.booking_id}</div>
                      <div className="mt-1 text-sm text-slate-700">
                        {b.booking_type ?? "—"} · {b.flight_number ?? "—"}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
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
            <a
              href="/ops/rules"
              className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              Manage Rules
            </a>
          }
        >
          {ruleRows.length === 0 ? (
            <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
              No active rules found.
            </div>
          ) : (
            <div className="grid gap-3">
              {ruleRows.map((r) => (
                <div key={r.id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="font-medium">{r.name}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Quick Actions" subtitle="Common operations">
          <div className="grid gap-3">
            <QuickLink href="/ops/reservations/new/seat" title="New Seat Reservation" subtitle="Reserve passenger seats on an operational flight." />
            <QuickLink href="/ops/reservations/new/charter" title="New Charter Reservation" subtitle="Reserve the full aircraft and block passenger inventory." />
            <QuickLink href="/ops/rules" title="Manage Rules" subtitle="Maintain operational flight rules used across the system." />
          </div>
        </Card>
      </div>
    </section>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-600">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
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
    <a href={href} className="rounded-xl border bg-white p-4 shadow-sm hover:bg-slate-50">
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm text-slate-700">{subtitle}</div>
    </a>
  );
}