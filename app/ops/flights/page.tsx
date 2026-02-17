import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

// ✅ Stable formatter (no locale drift; same everywhere)
function fmtUtc(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  // "2026-02-15 14:30 UTC"
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export default async function OpsFlightsPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_flight_inventory_summary")
    .select("*")
    .order("departure_time", { ascending: true });

  if (error) {
    return (
      <section className="space-y-6">
        <Card
          title="Flights"
          subtitle="Operational flight inventory view (authoritative)."
          right={
            <div className="flex items-center gap-2">
              <a
                className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
                href="/ops/flights/new"
              >
                + Create Flight
              </a>
              <a
                className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
                href="/ops"
              >
                Back to Command
              </a>
            </div>
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
      <Card
        title="Flights"
        subtitle="Operational flight inventory view (authoritative)."
        right={
          <div className="flex items-center gap-2">
            <a
              className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
              href="/ops/flights/new"
            >
              + Create Flight
            </a>
            <a
              className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
              href="/ops"
            >
              Back to Command
            </a>
          </div>
        }
      >
        {rows.length === 0 ? (
          <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
            No flights found.
          </div>
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
                {rows.map((r) => (
                  <tr key={r.flight_id} className="border-t hover:bg-slate-50">
                    <td className="font-semibold">
                      <a className="underline" href={`/ops/flights/${r.flight_id}`}>
                        {r.flight_number ?? r.flight_id}
                      </a>
                    </td>
                    <td>
                      <Badge tone={statusTone(r.flight_status)}>{r.flight_status ?? "—"}</Badge>
                    </td>
                    <td className="text-slate-700">{fmtUtc(r.departure_time)}</td>
                    <td className="text-slate-700">{fmtUtc(r.arrival_time)}</td>
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
    </section>
  );
}
