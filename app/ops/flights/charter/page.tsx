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
  cost: number;
  departure_tax: number;
  max_baggage_allowance_kg: number | null;
  flight_duration_minutes: number;
  charter_status: string;
  flight_rule_name: string | null;
};

function routeLabel(row: Row) {
  return row.via_airport_name
    ? `${row.departure_airport_name} → ${row.via_airport_name} → ${row.arrival_airport_name}`
    : `${row.departure_airport_name} → ${row.arrival_airport_name}`;
}

export default async function CharterFlightsPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_charter_flights_display")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <section className="space-y-6">
        <div>
          <div className="text-xs text-slate-600">Flights</div>
          <h1 className="mt-1 text-2xl font-semibold">Charter Flights</h1>
        </div>

        <FlightsSubnav />

        <Alert title="Charter Flights load failed" tone="red">
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
        <h1 className="mt-1 text-2xl font-semibold">Charter Flights</h1>
        <div className="mt-1 text-sm text-slate-700">
          Charter configuration for route, cost, baggage, duration, taxes and rules.
        </div>
      </div>

      <FlightsSubnav />

      <Card
        title="Charter Flights"
        subtitle="Charter flight configuration and fees."
        right={
          <a
            href="/ops/flights/charter/new"
            className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            + Add Charter Flight
          </a>
        }
      >
        {rows.length === 0 ? (
          <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
            No charter flight configurations found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="[&>th]:px-4 [&>th]:py-3">
                  <th>Flight</th>
                  <th>Route</th>
                  <th className="text-right">Cost</th>
                  <th className="text-right">Tax</th>
                  <th className="text-right">Baggage</th>
                  <th className="text-right">Duration</th>
                  <th>Rule</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
                {rows.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-slate-50">
                    <td className="font-semibold">{row.flight_number}</td>
                    <td>{routeLabel(row)}</td>
                    <td className="text-right">{row.cost ?? 0}</td>
                    <td className="text-right">{row.departure_tax ?? 0}</td>
                    <td className="text-right">{row.max_baggage_allowance_kg ?? "—"}</td>
                    <td className="text-right">{row.flight_duration_minutes ?? 0} min</td>
                    <td>{row.flight_rule_name ?? "—"}</td>
                    <td>{row.charter_status}</td>
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