import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { FlightsSubnav } from "../../FlightsSubnav";
import { NewCharterFlightForm } from "./NewCharterFlightForm";

export default async function NewCharterFlightPage() {
  await requireOpsUser();
  const supabase = createSupabaseAdminClient();

  const { data: airports, error: airportErr } = await supabase
    .from("airports")
    .select("id, name, icao, is_active")
    .order("name", { ascending: true });

  const { data: rules, error: rulesErr } = await supabase
    .from("flight_rules")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const error = airportErr ?? rulesErr;
  const activeAirports = (airports ?? []).filter((a: any) => a.is_active !== false);

  if (error) {
    return (
      <section className="space-y-6">
        <div>
          <div className="text-xs text-slate-600">Flights</div>
          <h1 className="mt-1 text-2xl font-semibold">Add Charter Flight</h1>
        </div>

        <FlightsSubnav />

        <Alert title="Setup required" tone="red">
          {error.message}
        </Alert>
      </section>
    );
  }

  if (activeAirports.length === 0) {
    return (
      <section className="space-y-6">
        <div>
          <div className="text-xs text-slate-600">Flights</div>
          <h1 className="mt-1 text-2xl font-semibold">Add Charter Flight</h1>
        </div>

        <FlightsSubnav />

        <Alert title="No airports available" tone="red">
          No active airports were found. Please add or activate airports first.
        </Alert>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Flights</div>
        <h1 className="mt-1 text-2xl font-semibold">Add Charter Flight</h1>
        <div className="mt-1 text-sm text-slate-700">
          Create charter flight configuration with costs, taxes, duration, baggage allowance and rules.
        </div>
      </div>

      <FlightsSubnav />

      <Card
        title="Manage Charter Flights"
        subtitle="Sygen-style charter configuration, cleaner and controlled."
      >
        <NewCharterFlightForm airports={activeAirports} rules={rules ?? []} />
      </Card>
    </section>
  );
}