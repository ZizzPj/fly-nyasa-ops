import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

import { FlightStatusControl } from "./FlightStatusControl";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, statusTone } from "@/components/ui/Badge";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

type FlightSummary = {
  flight_id: string;
  flight_number: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  flight_status: string | null;
  seats_available: number | null;
  seats_held: number | null;
  seats_confirmed: number | null;
  seats_blocked: number | null;
};

type BookingOpsRow = {
  booking_id: string;
  booking_type: string | null;
  status: string | null;
  flight_id: string;
  created_at: string | null;
  seat_count: number | null;
  charter_count: number | null;
};

export default async function FlightDetailPage({
  params,
}: {
  params: Promise<{ flight_id: string }>;
}) {
  await requireOpsUser();

  const { flight_id } = await params;
  const flightId = flight_id;

  if (!flightId || !isUuid(flightId)) {
    return (
      <Alert title="Invalid flight id" tone="red">
        Received: <code>{String(flightId)}</code>
      </Alert>
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: flight, error: fErr } = await supabase
    .from("v_flight_inventory_summary")
    .select("*")
    .eq("flight_id", flightId)
    .maybeSingle();

  if (fErr) {
    return (
      <Alert title="Flight load failed" tone="red">
        {fErr.message}
      </Alert>
    );
  }

  if (!flight) notFound();
  const f = flight as FlightSummary;

  const { data: bookings, error: bErr } = await supabase
    .from("v_booking_operations")
    .select("booking_id,booking_type,status,flight_id,created_at,seat_count,charter_count")
    .eq("flight_id", flightId)
    .order("created_at", { ascending: false });

  const rows = (bookings ?? []) as BookingOpsRow[];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs text-slate-600">Flight detail</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {f.flight_number ?? f.flight_id}
          </h1>
          <div className="mt-1 text-sm text-slate-700">
            Departure: {fmt(f.departure_time)} · Arrival: {fmt(f.arrival_time)}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Badge tone={statusTone(f.flight_status)}>{f.flight_status ?? "—"}</Badge>
          <a className="text-sm font-medium text-slate-700 underline" href="/app/ops/flights">
            Back to Flights
          </a>
        </div>
      </div>

      <Card
        title="Operational Controls"
        subtitle="All state changes are server-enforced and auditable."
        right={<FlightStatusControl flightId={f.flight_id} currentStatus={f.flight_status} />}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <Stat title="Available" value={f.seats_available ?? 0} />
          <Stat title="Held" value={f.seats_held ?? 0} />
          <Stat title="Confirmed" value={f.seats_confirmed ?? 0} />
          <Stat title="Blocked" value={f.seats_blocked ?? 0} />
        </div>

        <div className="mt-4 rounded-xl border bg-slate-50 p-3 text-sm text-slate-700">
          Inventory counts are derived from the authoritative flight inventory view.
        </div>
      </Card>

      <Card title="Bookings on this flight" subtitle="Linked bookings derived from v_booking_operations.">
        {bErr ? (
          <Alert title="Bookings load failed" tone="red">
            {bErr.message}
          </Alert>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
            No bookings exist for this flight.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="[&>th]:px-4 [&>th]:py-3">
                  <th>Booking</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-right">Seats</th>
                  <th className="text-right">Charter</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
                {rows.map((b) => (
                  <tr key={b.booking_id} className="border-t hover:bg-slate-50">
                    <td className="font-semibold">
                      <a className="underline" href={`/ops/bookings/${b.booking_id}`}>
                        {b.booking_id}
                      </a>
                    </td>
                    <td className="text-slate-700">{b.booking_type ?? "—"}</td>
                    <td>
                      <Badge tone={statusTone(b.status)}>{b.status ?? "—"}</Badge>
                    </td>
                    <td className="text-slate-700">{fmt(b.created_at)}</td>
                    <td className="text-right font-medium">{b.seat_count ?? 0}</td>
                    <td className="text-right font-medium">{b.charter_count ?? 0}</td>
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

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-600">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
