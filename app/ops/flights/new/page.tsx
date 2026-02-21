import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { CreateFlightForm } from "./CreateFlightForm";

export default async function NewFlightPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  // You need a view or query that returns routes with readable names.
  const { data: routes, error: rErr } = await supabase
    .from("v_routes_display")
    .select("*")
    .order("origin_name", { ascending: true });

  const { data: aircraft, error: aErr } = await supabase
    .from("v_aircraft_with_seat_config")
    .select("*")
    .order("model", { ascending: true });

  if (rErr || aErr) {
    return (
      <Alert title="Setup required" tone="red">
        {rErr?.message ?? aErr?.message}
      </Alert>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Flights</div>
        <h1 className="mt-1 text-2xl font-semibold">Create Flight</h1>
        <div className="text-sm text-slate-700">
          Add a flight, generate seat inventory, and prepare it for bookings.
        </div>
      </div>

      <Card title="New Flight" subtitle="Ops-friendly: choose route + aircraft, no IDs.">
        <CreateFlightForm routes={routes ?? []} aircraft={aircraft ?? []} />
      </Card>
    </section>
  );
}
