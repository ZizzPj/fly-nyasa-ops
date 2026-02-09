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

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
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
      <Alert title="Flights load failed" tone="red">
        {error.message}
      </Alert>
    );
  }

  const rows = (data ?? []) as FlightRow[];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs text-slate-600">Operations</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Flights</h1>
          <div className="mt-1 text-sm text-slate-600">
            Live inventory summary from <span className="font-mono">v_flight_inventory_summary</span>.
          </div>
        </div>

        <a className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50" href="/ops">
          ← Back to Command
        </a>
      </div>

      <Card title="All flights" subtitle="Inventory: Available / Held / Confirmed / Blocked">
        {rows.length === 0 ? (
          <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
            No flights found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="border-b">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Flight</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Departure</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Arrival</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Avail
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Held
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Conf
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Blocked
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <tr key={r.flight_id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">
                      <a className="underline" href={`/ops/flights/${r.flight_id}`}>
                        {r.flight_number ?? r.flight_id}
                      </a>
                      <div className="mt-1 text-xs text-slate-500 font-normal">
                        <span className="font-mono">{r.flight_id}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge tone={statusTone(r.flight_status)}>{r.flight_status ?? "—"}</Badge>
                    </td>

                    <td className="px-4 py-3 text-slate-700">{fmt(r.departure_time)}</td>
                    <td className="px-4 py-3 text-slate-700">{fmt(r.arrival_time)}</td>

                    <td className="px-4 py-3 text-right font-medium">{r.seats_available ?? 0}</td>
                    <td className="px-4 py-3 text-right font-medium">{r.seats_held ?? 0}</td>
                    <td className="px-4 py-3 text-right font-medium">{r.seats_confirmed ?? 0}</td>
                    <td className="px-4 py-3 text-right font-medium">{r.seats_blocked ?? 0}</td>
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
