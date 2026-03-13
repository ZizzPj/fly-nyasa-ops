import Link from "next/link";
import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, statusTone } from "@/components/ui/Badge";
import { FlightsSubnav } from "./FlightsSubnav";
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
        <PageHeader eyebrow="Flights" title="Flight schedules" subtitle="Operational flight inventory and schedule control." />
        <FlightsSubnav />
        <Card
          title="Flight schedules"
          subtitle="Operational flight inventory view."
          right={
            <Link
              className="button-primary rounded-full px-4 py-2 text-sm font-semibold"
              href="/ops/flights/new"
            >
              Create operational flight
            </Link>
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
      <PageHeader
        eyebrow="Flights"
        title="Flight schedules"
        subtitle="Operational flight instances with live inventory, route visibility, and fast access to flight-level controls."
        actions={<Link className="button-primary rounded-full px-4 py-2 text-sm font-semibold" href="/ops/flights/new">Create flight</Link>}
      />

      <FlightsSubnav />

      <Card
        title="Flight schedules"
        subtitle="Operational flights generated for reservations and inventory control."
      >
        {rows.length === 0 ? (
          <div className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-6 text-sm text-[color:var(--ink-muted)]">
            No flight schedules found.
          </div>
        ) : (
          <div className="dashboard-table overflow-x-auto rounded-[24px]">
            <table className="w-full text-sm">
              <thead className="text-left text-[color:var(--ink-muted)]">
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
                  <tr key={r.flight_id}>
                    <td className="font-semibold">
                      <Link className="underline decoration-[color:var(--brand)] underline-offset-4" href={`/ops/flights/${r.flight_id}`}>
                        {r.flight_number ?? r.flight_id}
                      </Link>
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
                      <Link
                        href={`/ops/flights/${r.flight_id}`}
                        className="button-secondary rounded-full px-3 py-1.5 text-xs font-semibold"
                      >
                        View
                      </Link>
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
