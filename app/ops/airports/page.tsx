import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { CreateAirportForm } from "./CreateAirportForm";

type AirportRow = {
  id: string;
  name: string;
  icao: string | null;
  airport_type: string | null;
  is_active: boolean;
};

export default async function AirportsPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("airports")
    .select("id, name, icao, airport_type, is_active")
    .order("name", { ascending: true });

  if (error) {
    return (
      <section className="space-y-6">
        <Alert title="Airports load failed" tone="red">
          {error.message}
        </Alert>
      </section>
    );
  }

  const rows = (data ?? []) as AirportRow[];

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Ops</div>
        <h1 className="mt-1 text-2xl font-semibold">Airports & Airstrips</h1>
        <div className="mt-1 text-sm text-slate-700">
          Add and manage airports and airstrips used in operations.
        </div>
      </div>

      <Card title="Add Airport / Airstrip" subtitle="Create a new location.">
        <CreateAirportForm />
      </Card>

      <Card title="Locations" subtitle="All configured airports and airstrips.">
        {rows.length === 0 ? (
          <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
            No locations found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="[&>th]:px-4 [&>th]:py-3">
                  <th>Name</th>
                  <th>ICAO</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
                {rows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-slate-50">
                    <td className="font-semibold">{r.name}</td>
                    <td>{r.icao ?? "—"}</td>
                    <td>{r.airport_type ?? "AIRPORT"}</td>
                    <td>{r.is_active ? "Active" : "Inactive"}</td>
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