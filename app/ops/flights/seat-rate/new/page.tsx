import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { FlightsSubnav } from "../../FlightsSubnav";
import { NewSeatRateForm } from "./NewSeatRateForm";

export default async function NewSeatRatePage() {
  await requireOpsUser();
  const supabase = createSupabaseAdminClient();

  const { data: airports, error: airportErr } = await supabase
    .from("airports")
    .select("id, name, icao, is_active")
    .order("name", { ascending: true });

  const { data: aircraft, error: aircraftErr } = await supabase
    .from("v_aircraft_with_seat_config")
    .select("*")
    .order("model", { ascending: true });

  const { data: rules, error: rulesErr } = await supabase
    .from("flight_rules")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const error = airportErr ?? aircraftErr ?? rulesErr;
  const activeAirports = (airports ?? []).filter((a: any) => a.is_active !== false);

  if (error) {
    return (
      <section className="space-y-6">
        <div>
          <div className="text-xs text-slate-600">Flights</div>
          <h1 className="mt-1 text-2xl font-semibold">Add Seat Rate Flight</h1>
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
          <h1 className="mt-1 text-2xl font-semibold">Add Seat Rate Flight</h1>
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
        <h1 className="mt-1 text-2xl font-semibold">Add Seat Rate Flight</h1>
        <div className="mt-1 text-sm text-slate-700">
          Create a recurring seat-rate flight schedule with fares, baggage allowance,
          taxes and rules.
        </div>
      </div>

      <FlightsSubnav />

      <Card
        title="Seat Rate Flight Setup"
        subtitle="Sygen-style seat rate setup, cleaner and better controlled."
      >
        <NewSeatRateForm
          airports={activeAirports}
          aircraft={aircraft ?? []}
          rules={rules ?? []}
        />
      </Card>
    </section>
  );
}