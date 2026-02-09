import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, statusTone } from "@/components/ui/Badge";

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

function shortId(id: string) {
  if (!id) return "—";
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

const VALID_STATUSES = ["DRAFT", "HELD", "CONFIRMED", "CANCELLED", "EXPIRED"] as const;
const VALID_TYPES = ["SEAT", "CHARTER"] as const;

export default async function OpsBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; q?: string }>;
}) {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const sp = await searchParams;
  const status = (sp.status ?? "").toUpperCase();
  const type = (sp.type ?? "").toUpperCase();
  const q = (sp.q ?? "").trim();

  let query = supabase
    .from("v_booking_operations")
    .select("*")
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false });

  if (status && (VALID_STATUSES as readonly string[]).includes(status)) {
    query = query.eq("status", status);
  }

  if (type && (VALID_TYPES as readonly string[]).includes(type)) {
    query = query.eq("booking_type", type);
  }

  // Search: booking_id OR flight_number
  // Supabase "or" syntax must be a single string.
  if (q) {
    // ilike on UUID is safe; it’s just text matching.
    query = query.or(`booking_id.ilike.%${q}%,flight_number.ilike.%${q}%`);
  }

  const { data, error } = await query;
  const rows = (data ?? []) as BookingRow[];

  // KPIs from the same fetched set (no extra queries)
  const total = rows.length;
  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    const s = (r.status ?? "—").toUpperCase();
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs text-slate-600">Operations</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Bookings</h1>
          <div className="mt-1 text-sm text-slate-600">
            Operational booking view from <span className="font-mono">v_booking_operations</span>.
          </div>
        </div>

        <a className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50" href="/ops">
          ← Back to Command
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi title="Visible bookings" value={String(total)} />
        <Kpi title="Draft" value={String(byStatus["DRAFT"] ?? 0)} />
        <Kpi title="Held" value={String(byStatus["HELD"] ?? 0)} />
        <Kpi title="Confirmed" value={String(byStatus["CONFIRMED"] ?? 0)} />
      </div>

      <Card
        title="Bookings"
        subtitle="Filters are server-enforced. Actions are audited and atomic on the backend."
      >
        <Filters status={status} type={type} q={q} />

        {error ? (
          <div className="mt-4">
            <Alert title="Bookings load failed" tone="red">
              {error.message}
            </Alert>
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-4 rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
            No bookings match your filters.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="border-b">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Booking
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Type
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Flight
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Departure
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Seats
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Charter
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Updated
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((b) => (
                  <tr key={b.booking_id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <a
                        href={`/ops/bookings/${b.booking_id}`}
                        className="font-semibold underline"
                        title={b.booking_id}
                      >
                        {shortId(b.booking_id)}
                      </a>
                      <div className="mt-1 text-xs text-slate-500 font-normal">
                        <span className="font-mono">{b.booking_id}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge tone={statusTone(b.status)}>{b.status ?? "—"}</Badge>
                    </td>

                    <td className="px-4 py-3 text-slate-700">{b.booking_type ?? "—"}</td>

                    <td className="px-4 py-3 text-slate-700">
                      <a href={`/ops/flights/${b.flight_id}`} className="underline">
                        {b.flight_number ?? b.flight_id}
                      </a>
                    </td>

                    <td className="px-4 py-3 text-slate-700">{fmt(b.departure_time)}</td>
                    <td className="px-4 py-3 text-right font-medium">{b.seat_count ?? 0}</td>
                    <td className="px-4 py-3 text-right font-medium">{b.charter_count ?? 0}</td>
                    <td className="px-4 py-3 text-slate-700">{fmt(b.updated_at)}</td>
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

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-600">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Filters({
  status,
  type,
  q,
}: {
  status: string;
  type: string;
  q: string;
}) {
  const base = "/ops/bookings";
  return (
    <form action={base} method="get" className="rounded-xl border bg-slate-50 p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-700">Status</label>
          <select
            name="status"
            defaultValue={status}
            className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="DRAFT">DRAFT</option>
            <option value="HELD">HELD</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-700">Type</label>
          <select
            name="type"
            defaultValue={type}
            className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="SEAT">SEAT</option>
            <option value="CHARTER">CHARTER</option>
          </select>
        </div>

        <div className="flex flex-col sm:col-span-2">
          <label className="text-xs font-medium text-slate-700">Search</label>
          <input
            name="q"
            defaultValue={q}
            placeholder="Booking ID or flight number (e.g. c04d0… or FN101)"
            className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Apply
        </button>
        <a className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50" href={base}>
          Reset
        </a>
      </div>
    </form>
  );
}
