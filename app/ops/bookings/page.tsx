import Link from "next/link";
import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, statusTone } from "@/components/ui/Badge";
import { routeLabel } from "@/lib/format/routeLabel";
import { PageHeader } from "@/components/ui/PageHeader";

type BookingRow = {
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
  departure_airport_name: string | null;
  via_airport_name: string | null;
  arrival_airport_name: string | null;
  passenger_name: string | null;
  agent_name: string | null;
  total_cost: number | null;
};

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function money(v: number | null | undefined) {
  return v == null ? "0.00" : Number(v).toFixed(2);
}

export default async function BookingsPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_booking_operations_enriched")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <section className="space-y-6">
        <Alert title="Bookings load failed" tone="red">
          {error.message}
        </Alert>
      </section>
    );
  }

  const rows = (data ?? []) as BookingRow[];

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Bookings"
        title="Booking control"
        subtitle="Review reservations, ticket bookings, and cancel inventory from the authoritative commercial operations view."
      />

      <Card
        title="Bookings"
        subtitle="Authoritative booking operations view."
        right={
          <Link
            href="/ops/reservations"
            className="button-secondary rounded-full px-4 py-2 text-sm font-semibold"
          >
            Go to reservations
          </Link>
        }
      >
        {rows.length === 0 ? (
          <div className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-6 text-sm text-[color:var(--ink-muted)]">
            No bookings found.
          </div>
        ) : (
          <div className="dashboard-table overflow-x-auto rounded-[24px]">
            <table className="w-full text-sm">
              <thead className="text-left text-[color:var(--ink-muted)]">
                <tr className="[&>th]:px-4 [&>th]:py-3">
                  <th>Booking</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Flight</th>
                  <th>Route</th>
                  <th className="text-right">Seats</th>
                  <th className="text-right">Charter</th>
                  <th>Passenger / Client</th>
                  <th>Agent</th>
                  <th className="text-right">Total</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
                {rows.map((r) => (
                  <tr key={r.booking_id}>
                    <td className="font-semibold">{r.booking_id}</td>
                    <td>
                      <Badge tone={statusTone(r.booking_type)}>{r.booking_type ?? "—"}</Badge>
                    </td>
                    <td>
                      <Badge tone={statusTone(r.status)}>{r.status ?? "—"}</Badge>
                    </td>
                    <td>
                      <Link className="underline decoration-[color:var(--brand)] underline-offset-4" href={`/ops/flights/${r.flight_id}`}>
                        {r.flight_number ?? r.flight_id}
                      </Link>
                    </td>
                    <td>
                      {routeLabel({
                        departure_airport_name: r.departure_airport_name,
                        via_airport_name: r.via_airport_name,
                        arrival_airport_name: r.arrival_airport_name,
                      })}
                    </td>
                    <td className="text-right">{r.seat_count ?? 0}</td>
                    <td className="text-right">{r.charter_count ?? 0}</td>
                    <td>{r.passenger_name ?? "—"}</td>
                    <td>{r.agent_name ?? "—"}</td>
                    <td className="text-right">{money(r.total_cost)}</td>
                    <td>{fmt(r.created_at)}</td>
                    <td>
                      <Link
                        href={`/ops/bookings/${r.booking_id}`}
                        className="button-secondary rounded-full px-3 py-1.5 text-xs font-semibold"
                      >
                        Open
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
