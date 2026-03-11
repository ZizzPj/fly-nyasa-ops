import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, statusTone } from "@/components/ui/Badge";
import { FlightsSubnav } from "./FlightsSubnav";

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

function fmtUtc(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function routeLabel(row: FlightRow) {
  return row.via_airport_name
    ? `${row.departure_airport_name} → ${row.via_airport_name} → ${row.arrival_airport_name}`
    : `${row.departure_airport_name} → ${row.arrival_airport_name}`;
}

export default async function OpsFlightsPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_operational_flights_display")
    .select("*")
    .order("departure_time", { ascending: true });

  if (error) {
    return (
      <section className="space-y-6">
        <div>
          <div className="text-xs text-slate-600">Flights</div>
          <h1 className="mt-1 text-2xl font-semibold">Flight Schedules</h1>
        </div>

        <FlightsSubnav />

        <Card
          title="Flight Schedules"
          subtitle="Operational flight inventory view."
          right={
            <a
              className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
              href="/ops/flights/new"
            >
              + Create Operational Flight
            </a>
          }
        >
          <Alert title="Flights load failed" tone="red">
            {error.message}
          </Alert>
        </Card>
      </section>
    );
  }

  const rows = (data ?? []) as FlightRow[];

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Flights</div>
        <h1 className="mt-1 text-2xl font-semibold">Flight Schedules</h1>
        <div className="mt-1 text-sm text-slate-700">
          Real operational flight instances with live inventory and route visibility.
        </div>
      </div>

      <FlightsSubnav />

      <Card
        title="Flight Schedules"
        subtitle="Operational flights generated for reservations and inventory control."
      >
        {rows.length === 0 ? (
          <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
            No flight schedules found.
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
                  <th className="text-right">Avail</th>
                  <th className="text-right">Held</th>
                  <th className="text-right">Ticketed</th>
                  <th className="text-right">Blocked</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
                {rows.map((r) => (
                  <tr key={r.flight_id} className="border-t hover:bg-slate-50">
                    <td className="font-semibold">
                      <a className="underline" href={`/ops/flights/${r.flight_id}`}>
                        {r.flight_number ?? r.flight_id}
                      </a>
                    </td>
                    <td>{routeLabel(r)}</td>
                    <td>
                      <Badge tone={statusTone(r.flight_status)}>
                        {r.flight_status ?? "—"}
                      </Badge>
                    </td>
                    <td>{fmtUtc(r.departure_time)}</td>
                    <td>{fmtUtc(r.arrival_time)}</td>
                    <td className="text-right">{r.seats_available ?? 0}</td>
                    <td className="text-right">{r.seats_held ?? 0}</td>
                    <td className="text-right">{r.seats_confirmed ?? 0}</td>
                    <td className="text-right">{r.seats_blocked ?? 0}</td>
                    <td>
                      <a
                        href={`/ops/flights/${r.flight_id}`}
                        className="rounded-lg border bg-white px-3 py-1.5 text-xs hover:bg-slate-50"
                      >
                        View
                      </a>
                    </td>
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