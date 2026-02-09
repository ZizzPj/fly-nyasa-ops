// app/ops/reservations/page.tsx
import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { ReservationsCreateForm } from "./ReservationsCreateForm";
import { ReleaseExpiredHoldsButton } from "./ReleaseExpiredHoldsButton";

type FlightRow = {
  flight_id: string;
  flight_number: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  flight_status: string | null;
  seats_available: number | null;
};

type BookingOpsRow = {
  booking_id: string;
  booking_type: string | null;
  status: string | null;
  flight_id: string;
  flight_number: string | null;
  departure_time: string | null;
  created_at: string | null;
  updated_at: string | null;
  seat_count: number | null;
  charter_count: number | null;
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function ReservationsPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  // Flights list for creating holds + reference
  const { data, error } = await supabase
    .from("v_flight_inventory_summary")
    .select(
      "flight_id,flight_number,departure_time,arrival_time,flight_status,seats_available"
    )
    .order("departure_time", { ascending: true })
    .limit(200);

  if (error) {
    return (
      <Alert title="Flights load failed" tone="red">
        {error.message}
      </Alert>
    );
  }

  const flights = (data ?? []) as FlightRow[];

  // Today’s reservation activity (quick ops visibility)
  const { data: todayBookings, error: tErr } = await supabase
    .from("v_booking_operations")
    .select("*")
    .gte("created_at", startOfTodayIso())
    .order("created_at", { ascending: false })
    .limit(50);

  const trows = (todayBookings ?? []) as BookingOpsRow[];

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Reservations</div>
        <h1 className="mt-1 text-2xl font-semibold">Create Booking Hold</h1>
        <div className="mt-1 text-sm text-slate-700">
          Creates an inventory-safe hold via database RPC (seats: HELD, charter:
          OPTIONED). Holds must be confirmed or cancelled by Ops.
        </div>
      </div>

      <Card
        title="New Reservation"
        subtitle="Creates a HOLD (max 36 hours). Ops can later confirm or cancel."
      >
        <ReservationsCreateForm flights={flights} />
      </Card>

      <Card
        title="Operational automation"
        subtitle="Manual ops trigger. Safe: enforced by server + database."
        right={<ReleaseExpiredHoldsButton />}
      >
        <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
          Use this to release expired seat holds immediately (e.g., before
          reporting or end-of-day checks). This revalidates Flights, Bookings,
          and Reservations pages.
        </div>
      </Card>

      <Card
        title="Today’s reservations"
        subtitle="Quick visibility into reservations created today (v_booking_operations)."
      >
        {tErr ? (
          <Alert title="Could not load today’s reservations" tone="red">
            {tErr.message}
          </Alert>
        ) : trows.length === 0 ? (
          <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
            No reservations created today.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="[&>th]:px-4 [&>th]:py-3">
                  <th>Booking</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Flight</th>
                  <th>Created</th>
                  <th className="text-right">Seats</th>
                  <th className="text-right">Charter</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
                {trows.map((b) => {
                  const bookingHref = isUuid(b.booking_id)
                    ? `/ops/bookings/${b.booking_id}`
                    : "/ops/bookings";

                  const flightHref = isUuid(b.flight_id)
                    ? `/ops/flights/${b.flight_id}`
                    : "/ops/flights";

                  return (
                    <tr key={b.booking_id} className="border-t hover:bg-slate-50">
                      <td className="font-semibold">
                        <a className="underline" href={bookingHref}>
                          {b.booking_id}
                        </a>
                      </td>
                      <td className="text-slate-700">{b.status ?? "—"}</td>
                      <td className="text-slate-700">{b.booking_type ?? "—"}</td>
                      <td className="text-slate-700">
                        <a className="underline" href={flightHref}>
                          {b.flight_number ?? b.flight_id}
                        </a>
                      </td>
                      <td className="text-slate-700">{fmt(b.created_at)}</td>
                      <td className="text-right font-medium">
                        {b.seat_count ?? 0}
                      </td>
                      <td className="text-right font-medium">
                        {b.charter_count ?? 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Available flights" subtitle="Reference list from v_flight_inventory_summary">
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr className="[&>th]:px-4 [&>th]:py-3">
                <th>Flight</th>
                <th>Status</th>
                <th>Departure</th>
                <th>Arrival</th>
                <th className="text-right">Seats Avail</th>
              </tr>
            </thead>
            <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
              {flights.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-600">
                    No flights found.
                  </td>
                </tr>
              ) : (
                flights.map((f) => {
                  const href = isUuid(f.flight_id)
                    ? `/ops/flights/${f.flight_id}`
                    : "/ops/flights";

                  return (
                    <tr key={f.flight_id} className="border-t hover:bg-slate-50">
                      <td className="font-semibold">
                        <a className="underline" href={href}>
                          {f.flight_number ?? f.flight_id}
                        </a>
                      </td>
                      <td className="text-slate-700">{f.flight_status ?? "—"}</td>
                      <td className="text-slate-700">{fmt(f.departure_time)}</td>
                      <td className="text-slate-700">{fmt(f.arrival_time)}</td>
                      <td className="text-right font-medium">
                        {f.seats_available ?? 0}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

