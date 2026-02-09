import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CloseCutoffButton } from "./actions/CloseCutoffButton";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, statusTone } from "@/components/ui/Badge";

type FlightRow = {
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
};

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function dayKey(iso: string | null | undefined) {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function sumNum(rows: any[], key: string) {
  return rows.reduce((acc, r) => acc + (typeof r?.[key] === "number" ? r[key] : 0), 0);
}

export default async function OpsCommandCenter() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const nowIso = now.toISOString();
  const horizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: flights, error: fErr } = await supabase
    .from("v_flight_inventory_summary")
    .select("*")
    .gte("departure_time", nowIso)
    .lt("departure_time", horizon)
    .order("departure_time", { ascending: true });

  const { data: bookings, error: bErr } = await supabase
    .from("v_booking_operations")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(20);

  const flightRows = (flights ?? []) as FlightRow[];
  const bookingRows = (bookings ?? []) as BookingRow[];

  const upcomingCount = flightRows.length;
  const recentBookingsCount = bookingRows.length;

  const seatsConfirmed = sumNum(flightRows as any[], "seats_confirmed");
  const seatsAvailable = sumNum(flightRows as any[], "seats_available");
  const seatsHeld = sumNum(flightRows as any[], "seats_held");

  const grouped = new Map<string, FlightRow[]>();
  flightRows.forEach((r) => {
    const key = dayKey(r.departure_time);
    const arr = grouped.get(key) ?? [];
    arr.push(r);
    grouped.set(key, arr);
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Operations Command Center</h1>
          <div className="mt-1 text-sm text-slate-600">
            Live operational state using authoritative inventory and booking views.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50" href="/ops/flights">
            Flights
          </a>
          <a className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50" href="/ops/bookings">
            Bookings
          </a>
          <CloseCutoffButton />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Kpi title="Upcoming flights (14 days)" value={String(upcomingCount)} />
        <Kpi title="Recent booking updates" value={String(recentBookingsCount)} />
        <Kpi title="Seats confirmed (upcoming)" value={String(seatsConfirmed)} />
        <Kpi title="Seats available (upcoming)" value={String(seatsAvailable)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Schedule"
          subtitle="Upcoming departures grouped by day (next 14 days)"
        >
          {fErr ? (
            <Alert title="Flights load failed" tone="red">
              {fErr.message}
            </Alert>
          ) : grouped.size === 0 ? (
            <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
              No upcoming flights in the next 14 days.
            </div>
          ) : (
            <div className="space-y-4">
              {[...grouped.entries()].map(([date, rows]) => (
                <div key={date} className="rounded-xl border bg-white">
                  <div className="border-b bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700">
                    {date}
                  </div>
                  <div className="p-3 space-y-2">
                    {rows.map((r) => (
                      <a
                        key={r.flight_id}
                        className="block rounded-lg border bg-white p-3 hover:bg-slate-50"
                        href={`/ops/flights/${r.flight_id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-semibold">
                              {r.flight_number ?? r.flight_id}
                            </div>
                            <div className="mt-1 text-sm text-slate-700">
                              Dep: {fmt(r.departure_time)} · Arr: {fmt(r.arrival_time)}
                            </div>
                          </div>
                          <div className="shrink-0">
                            <Badge tone={statusTone(r.flight_status)}>{r.flight_status ?? "—"}</Badge>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-slate-600">
                          <MiniStat label="Avail" value={r.seats_available ?? 0} />
                          <MiniStat label="Held" value={r.seats_held ?? 0} />
                          <MiniStat label="Conf" value={r.seats_confirmed ?? 0} />
                          <MiniStat label="Blocked" value={r.seats_blocked ?? 0} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Recent Activity"
          subtitle="Most recently updated bookings (last 20 updates)"
        >
          {bErr ? (
            <Alert title="Bookings load failed" tone="red">
              {bErr.message}
            </Alert>
          ) : bookingRows.length === 0 ? (
            <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
              No booking updates found.
            </div>
          ) : (
            <div className="divide-y rounded-xl border bg-white">
              {bookingRows.map((r) => (
                <a
                  key={r.booking_id}
                  className="block p-4 hover:bg-slate-50"
                  href={`/ops/bookings/${r.booking_id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{r.booking_id}</div>
                      <div className="mt-1 text-sm text-slate-700">
                        <span className="font-medium">{r.booking_type ?? "—"}</span>{" "}
                        · <span>{r.status ?? "—"}</span> · Flight{" "}
                        <span className="font-medium">{r.flight_number ?? r.flight_id}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        Dep {fmt(r.departure_time)} · Seats {r.seat_count ?? 0} · Charter{" "}
                        {r.charter_count ?? 0}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge tone={statusTone(r.status)}>{r.status ?? "—"}</Badge>
                      <div className="text-xs text-slate-600">{fmt(r.updated_at)}</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Optional: show held pressure to ops */}
      {seatsHeld > 0 ? (
        <Alert title="Operational notice" tone="amber">
          There are currently <strong>{seatsHeld}</strong> seats held in the upcoming 14-day window.
          Ensure holds are confirmed or released as appropriate.
        </Alert>
      ) : null}
    </section>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-600">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-slate-50 px-2 py-1">
      <div className="text-[11px] text-slate-600">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
