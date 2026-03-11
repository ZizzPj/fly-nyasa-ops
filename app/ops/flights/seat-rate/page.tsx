import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { FlightsSubnav } from "../FlightsSubnav";

type Row = {
  id: string;
  flight_number: string;
  departure_airport_name: string;
  via_airport_name: string | null;
  arrival_airport_name: string;
  start_date: string;
  end_date: string;
  schedule_status: string;
  etd: string;
  eta: string;
  max_baggage_allowance_kg: number | null;
  adult_fare: number;
  child_fare: number;
  departure_tax: number;
  flight_rule_name: string | null;
};

function routeLabel(row: Row) {
  return row.via_airport_name
    ? `${row.departure_airport_name} → ${row.via_airport_name} → ${row.arrival_airport_name}`
    : `${row.departure_airport_name} → ${row.arrival_airport_name}`;
}

export default async function SeatRateFlightsPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_seat_rate_flights_display")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <section className="space-y-6">
        <div>
          <div className="text-xs text-slate-600">Flights</div>
          <h1 className="mt-1 text-2xl font-semibold">Seat Rate Flights</h1>
        </div>

        <FlightsSubnav />

        <Alert title="Seat Rate Flights load failed" tone="red">
          {error.message}
        </Alert>
      </section>
    );
  }

  const rows = (data ?? []) as Row[];

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Flights</div>
        <h1 className="mt-1 text-2xl font-semibold">Seat Rate Flights</h1>
        <div className="mt-1 text-sm text-slate-700">
          Scheduled passenger flight setup with route, fares, taxes, baggage and rules.
        </div>
      </div>

      <FlightsSubnav />

      <Card
        title="Seat Rate Flights"
        subtitle="Recurring passenger flight configuration."
        right={
          <a
            href="/ops/flights/seat-rate/new"
            className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            + Add Seat Rate Flight
          </a>
        }
      >
        {rows.length === 0 ? (
          <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
            No seat rate flights found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="[&>th]:px-4 [&>th]:py-3">
                  <th>Flight</th>
                  <th>Route</th>
                  <th>Schedule Window</th>
                  <th>ETD / ETA</th>
                  <th className="text-right">Baggage</th>
                  <th className="text-right">Adult Fare</th>
                  <th className="text-right">Child Fare</th>
                  <th className="text-right">Tax</th>
                  <th>Rule</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
                {rows.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-slate-50">
                    <td className="font-semibold">{row.flight_number}</td>
                    <td>{routeLabel(row)}</td>
                    <td>
                      {row.start_date} → {row.end_date}
                    </td>
                    <td>
                      {row.etd} / {row.eta}
                    </td>
                    <td className="text-right">{row.max_baggage_allowance_kg ?? "—"}</td>
                    <td className="text-right">{row.adult_fare ?? 0}</td>
                    <td className="text-right">{row.child_fare ?? 0}</td>
                    <td className="text-right">{row.departure_tax ?? 0}</td>
                    <td>{row.flight_rule_name ?? "—"}</td>
                    <td>{row.schedule_status}</td>
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