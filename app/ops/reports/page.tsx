import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, statusTone } from "@/components/ui/Badge";

function isoToYmd(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function isoToUtc(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

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

function clampInt(v: string | null, fallback: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return Math.max(min, Math.min(max, i));
}

export default async function OpsReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const sp = await searchParams;

  const from = typeof sp.from === "string" ? sp.from : "";
  const to = typeof sp.to === "string" ? sp.to : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const type = typeof sp.type === "string" ? sp.type : "";
  const limit = clampInt(typeof sp.limit === "string" ? sp.limit : null, 200, 50, 2000);

  const fromIso = from ? new Date(from + "T00:00:00.000Z").toISOString() : null;
  const toIso = to ? new Date(to + "T23:59:59.999Z").toISOString() : null;

  // --- BOOKINGS REPORT (from v_booking_operations) ---
  let bookingsQ = supabase
    .from("v_booking_operations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (fromIso) bookingsQ = bookingsQ.gte("created_at", fromIso);
  if (toIso) bookingsQ = bookingsQ.lte("created_at", toIso);
  if (status) bookingsQ = bookingsQ.eq("status", status);
  if (type) bookingsQ = bookingsQ.eq("booking_type", type);

  const { data: bookings, error: bErr } = await bookingsQ;

  // --- FLIGHTS SNAPSHOT (inventory summary) ---
  const { data: flights, error: fErr } = await supabase
    .from("v_flight_inventory_summary")
    .select("*")
    .order("departure_time", { ascending: true })
    .limit(500);

  // --- HOLDS HEALTH (seat_inventory HELD + charter_inventory OPTIONED) ---
  // Look-ahead window: default 6 hours (configurable)
  const lookaheadMins = clampInt(typeof sp.lookahead === "string" ? sp.lookahead : null, 360, 30, 2160);
  const cutoffIso = new Date(Date.now() + lookaheadMins * 60_000).toISOString();

  const { data: seatHolds, error: shErr } = await supabase
    .from("seat_inventory")
    .select("id,flight_id,seat_id,status,held_until,booking_id,updated_at")
    .eq("status", "HELD")
    .not("held_until", "is", null)
    .lte("held_until", cutoffIso)
    .order("held_until", { ascending: true })
    .limit(500);

  const { data: charterHolds, error: chErr } = await supabase
    .from("charter_inventory")
    .select("id,flight_id,status,held_until,booking_id,updated_at")
    .eq("status", "OPTIONED")
    .order("held_until", { ascending: true })
    .limit(500);

  const bRows = (bookings ?? []) as BookingOpsRow[];
  const fRows = (flights ?? []) as FlightRow[];

  const qp = new URLSearchParams();
  if (from) qp.set("from", from);
  if (to) qp.set("to", to);
  if (status) qp.set("status", status);
  if (type) qp.set("type", type);
  qp.set("limit", String(limit));

  const csvBookingsHref = `/ops/reports/bookings.csv?${qp.toString()}`;
  const csvFlightsHref = `/ops/reports/flights.csv`;
  const csvHoldsHref = `/ops/reports/holds.csv?lookahead=${lookaheadMins}`;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Ops</div>
        <h1 className="mt-1 text-2xl font-semibold">Reports</h1>
        <div className="mt-1 text-sm text-slate-700">
          Operational exports for Ops review. CSV downloads are server-enforced.
        </div>
      </div>

      <Card
        title="Booking report"
        subtitle="Filter by date range / type / status. Export to CSV."
        right={
          <div className="flex items-center gap-2">
            <a className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50" href={csvBookingsHref}>
              Export CSV
            </a>
          </div>
        }
      >
        <form method="get" className="grid gap-3 rounded-xl border bg-slate-50 p-4 md:grid-cols-5">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-700">From</label>
            <input name="from" type="date" defaultValue={from} className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm" />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-700">To</label>
            <input name="to" type="date" defaultValue={to} className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm" />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-700">Status</label>
            <select name="status" defaultValue={status} className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="DRAFT">DRAFT</option>
              <option value="HELD">HELD</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-700">Type</label>
            <select name="type" defaultValue={type} className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="SEAT">SEAT</option>
              <option value="CHARTER">CHARTER</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-700">Limit</label>
            <input
              name="limit"
              type="number"
              min={50}
              max={2000}
              defaultValue={String(limit)}
              className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="md:col-span-5 flex items-center gap-2">
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              Apply filters
            </button>
            <a className="text-sm underline text-slate-700" href="/ops/reports">
              Reset
            </a>
          </div>
        </form>

        {bErr ? (
          <Alert title="Bookings report failed" tone="red">
            {bErr.message}
          </Alert>
        ) : bRows.length === 0 ? (
          <div className="mt-4 rounded-xl border bg-white p-6 text-sm text-slate-700">No bookings found.</div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="[&>th]:px-4 [&>th]:py-3">
                  <th>Booking</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Flight</th>
                  <th>Departure</th>
                  <th>Created</th>
                  <th className="text-right">Seats</th>
                  <th className="text-right">Charter</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
                {bRows.map((b) => (
                  <tr key={b.booking_id} className="border-t hover:bg-slate-50">
                    <td className="font-semibold">
                      <a className="underline" href={`/ops/bookings/${b.booking_id}`}>
                        {b.booking_id}
                      </a>
                    </td>
                    <td>
                      <Badge tone={statusTone(b.status)}>{b.status ?? "—"}</Badge>
                    </td>
                    <td>
                      <Badge tone={statusTone(b.booking_type)}>{b.booking_type ?? "—"}</Badge>
                    </td>
                    <td className="text-slate-700">
                      <a className="underline" href={`/ops/flights/${b.flight_id}`}>
                        {b.flight_number ?? b.flight_id}
                      </a>
                    </td>
                    <td className="text-slate-700">{isoToUtc(b.departure_time)}</td>
                    <td className="text-slate-700">{isoToUtc(b.created_at)}</td>
                    <td className="text-right font-medium">{b.seat_count ?? 0}</td>
                    <td className="text-right font-medium">{b.charter_count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Flights snapshot"
        subtitle="Inventory summary export (authoritative)."
        right={
          <a className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50" href={csvFlightsHref}>
            Export CSV
          </a>
        }
      >
        {fErr ? (
          <Alert title="Flights report failed" tone="red">
            {fErr.message}
          </Alert>
        ) : fRows.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-sm text-slate-700">No flights found.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="[&>th]:px-4 [&>th]:py-3">
                  <th>Flight</th>
                  <th>Status</th>
                  <th>Departure</th>
                  <th>Arrival</th>
                  <th className="text-right">Avail</th>
                  <th className="text-right">Held</th>
                  <th className="text-right">Conf</th>
                  <th className="text-right">Blocked</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
                {fRows.map((r) => (
                  <tr key={r.flight_id} className="border-t hover:bg-slate-50">
                    <td className="font-semibold">
                      <a className="underline" href={`/ops/flights/${r.flight_id}`}>
                        {r.flight_number ?? r.flight_id}
                      </a>
                    </td>
                    <td>
                      <Badge tone={statusTone(r.flight_status)}>{r.flight_status ?? "—"}</Badge>
                    </td>
                    <td className="text-slate-700">{isoToUtc(r.departure_time)}</td>
                    <td className="text-slate-700">{isoToUtc(r.arrival_time)}</td>
                    <td className="text-right font-medium">{r.seats_available ?? 0}</td>
                    <td className="text-right font-medium">{r.seats_held ?? 0}</td>
                    <td className="text-right font-medium">{r.seats_confirmed ?? 0}</td>
                    <td className="text-right font-medium">{r.seats_blocked ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Holds health"
        subtitle={`Seat holds expiring within ${lookaheadMins} minutes + charter optioned inventory.`}
        right={<a className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50" href={csvHoldsHref}>Export CSV</a>}
      >
        <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border bg-slate-50 p-4">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-700">Lookahead (mins)</label>
            <input
              name="lookahead"
              type="number"
              min={30}
              max={2160}
              defaultValue={String(lookaheadMins)}
              className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm"
            />
          </div>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Apply
          </button>
        </form>

        {(shErr || chErr) ? (
          <Alert title="Holds report failed" tone="red">
            {shErr?.message ?? chErr?.message}
          </Alert>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <div className="text-sm font-semibold">Seat holds expiring soon</div>
              <div className="mt-1 text-xs text-slate-600">Cutoff: {isoToUtc(cutoffIso)}</div>

              {(seatHolds ?? []).length === 0 ? (
                <div className="mt-3 text-sm text-slate-700">No expiring seat holds.</div>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left">
                      <tr className="[&>th]:px-3 [&>th]:py-2">
                        <th>Booking</th>
                        <th>Flight</th>
                        <th>Held until</th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr>td]:px-3 [&>tr>td]:py-2">
                      {(seatHolds ?? []).map((h: any) => (
                        <tr key={h.id} className="border-t">
                          <td className="font-mono text-xs">
                            {h.booking_id ? (
                              <a className="underline" href={`/ops/bookings/${h.booking_id}`}>{h.booking_id}</a>
                            ) : "—"}
                          </td>
                          <td className="font-mono text-xs">
                            <a className="underline" href={`/ops/flights/${h.flight_id}`}>{h.flight_id}</a>
                          </td>
                          <td className="text-slate-700">{isoToUtc(h.held_until)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-white p-4">
              <div className="text-sm font-semibold">Charter holds (OPTIONED)</div>
              {(charterHolds ?? []).length === 0 ? (
                <div className="mt-3 text-sm text-slate-700">No charter holds.</div>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left">
                      <tr className="[&>th]:px-3 [&>th]:py-2">
                        <th>Booking</th>
                        <th>Flight</th>
                        <th>Held until</th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr>td]:px-3 [&>tr>td]:py-2">
                      {(charterHolds ?? []).map((h: any) => (
                        <tr key={h.id} className="border-t">
                          <td className="font-mono text-xs">
                            {h.booking_id ? (
                              <a className="underline" href={`/ops/bookings/${h.booking_id}`}>{h.booking_id}</a>
                            ) : "—"}
                          </td>
                          <td className="font-mono text-xs">
                            <a className="underline" href={`/ops/flights/${h.flight_id}`}>{h.flight_id}</a>
                          </td>
                          <td className="text-slate-700">{isoToUtc(h.held_until)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
