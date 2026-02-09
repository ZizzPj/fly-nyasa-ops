import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { createSeatHoldBookingAction } from "@/app/ops/actions/createSeatHoldBookingAction";

type FlightRow = {
  flight_id: string;
  flight_number: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  flight_status: string | null;
  seats_available: number | null;
};

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default async function NewReservationPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("v_flight_inventory_summary")
    .select("flight_id,flight_number,departure_time,arrival_time,flight_status,seats_available")
    .gte("departure_time", nowIso)
    .order("departure_time", { ascending: true })
    .limit(30);

  const flights = (data ?? []) as FlightRow[];

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-600">Reservations</div>
          <h1 className="mt-1 text-2xl font-semibold">Add New Reservation</h1>
          <div className="mt-1 text-sm text-slate-600">
            Creates a booking and holds seats atomically. Max hold policy: <strong>36 hours</strong>.
          </div>
        </div>

        <a className="text-sm underline text-slate-700" href="/ops/reservations">
          Back to Reservations
        </a>
      </div>

      <Card title="Seat booking (auto-assign)" subtitle="Ops-only · server-side execution · DB-enforced locking.">
        {error ? (
          <Alert title="Flights load failed" tone="red">
            {error.message}
          </Alert>
        ) : flights.length === 0 ? (
          <Alert title="No upcoming flights available" tone="amber">
            Create or open flights first, then create bookings.
          </Alert>
        ) : (
          <form action={createSeatHoldBookingAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-700">Flight</label>
                <select
                  name="flight_id"
                  required
                  className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                >
                  {flights.map((f) => (
                    <option key={f.flight_id} value={f.flight_id}>
                      {(f.flight_number ?? "—")} · {fmt(f.departure_time)} · Avail {f.seats_available ?? 0} ·{" "}
                      {f.flight_status ?? "—"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Seat count</label>
                <input
                  name="seat_count"
                  type="number"
                  min={1}
                  step={1}
                  required
                  defaultValue={1}
                  className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                />
                <div className="mt-1 text-xs text-slate-600">
                  Seats are auto-selected from AVAILABLE inventory using row locks (no overbooking).
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Hold duration (minutes)</label>
                <input
                  name="hold_minutes"
                  type="number"
                  min={1}
                  max={2160}
                  step={1}
                  defaultValue={60}
                  className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                />
                <div className="mt-1 text-xs text-slate-600">
                  Max: 2160 minutes (36 hours). Holds expire via held_until.
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                Create booking & hold seats
              </button>
              <a
                href="/ops/reservations"
                className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </a>
            </div>
          </form>
        )}
      </Card>
    </section>
  );
}
