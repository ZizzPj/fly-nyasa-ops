import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { SeatReservationForm } from "./SeatReservationForm";
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
};

function fmtUtc(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export default async function SeatReservationPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_operational_flights_display")
    .select("*")
    .in("flight_status", ["OPEN", "SCHEDULED"])
    .order("departure_time", { ascending: true });

  if (error) {
    return (
      <section className="space-y-6">
        <Alert title="Flights load failed" tone="red">
          {error.message}
        </Alert>
      </section>
    );
  }

  const flights = ((data ?? []) as FlightRow[]).filter(
    (f) => (f.seats_available ?? 0) > 0
  );

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Reservations</div>
        <h1 className="mt-1 text-2xl font-semibold">Seat Rate Reservation</h1>
        <div className="mt-1 text-sm text-slate-700">
          Capture passenger reservation details and create a seat hold.
        </div>
      </div>

      <Card
        title="New Seat Reservation"
        subtitle="Operational reservation capture aligned to the current airline workflow."
      >
        <SeatReservationForm flights={flights} />
      </Card>

      <Card
        title="Available Flights"
        subtitle="Eligible flights with seat availability."
      >
        {flights.length === 0 ? (
          <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
            No flights with available seats found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="[&>th]:px-4 [&>th]:py-3">
                  <th>Flight</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Departure</th>
                  <th>Arrival</th>
                  <th className="text-right">Available Seats</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
                {flights.map((f) => (
                  <tr key={f.flight_id} className="border-t">
                    <td className="font-semibold">{f.flight_number ?? f.flight_id}</td>
                    <td>{routeLabel(f)}</td>
                    <td>{f.flight_status ?? "—"}</td>
                    <td>{fmtUtc(f.departure_time)}</td>
                    <td>{fmtUtc(f.arrival_time)}</td>
                    <td className="text-right">{f.seats_available ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}