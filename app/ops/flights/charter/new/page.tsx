import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { FlightsSubnav } from "../../FlightsSubnav";
import { NewCharterFlightForm } from "./NewCharterFlightForm";

export default async function NewCharterFlightPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const { data: airports, error: airportErr } = await supabase
    .from("airports")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const { data: rules, error: rulesErr } = await supabase
    .from("flight_rules")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const error = airportErr ?? rulesErr;

  if (error) {
    return (
      <section className="space-y-6">
        <div>
          <div className="text-xs text-slate-600">Flights</div>
          <h1 className="mt-1 text-2xl font-semibold">Add Chartered Fees</h1>
        </div>

        <FlightsSubnav />

        <Alert title="Setup required" tone="red">
          {error.message}
        </Alert>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Flights</div>
        <h1 className="mt-1 text-2xl font-semibold">Add Chartered Fees</h1>
        <div className="mt-1 text-sm text-slate-700">
          Create charter flight configuration with costs, taxes, duration, baggage allowance and rules.
        </div>
      </div>

      <FlightsSubnav />

      <Card title="Manage Charter Flights" subtitle="Sygen-style charter configuration, cleaner and controlled.">
        <NewCharterFlightForm airports={airports ?? []} rules={rules ?? []} />
      </Card>
    </section>
  );
}