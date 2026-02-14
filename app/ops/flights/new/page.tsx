import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { CreateFlightForm } from "./CreateFlightForm";

export default async function NewFlightPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const { data: routes, error: rErr } = await supabase
    .from("routes")
    .select("id,origin_airport,destination_airport,is_active")
    .eq("is_active", true)
    .order("origin_airport");

  const { data: aircraft, error: aErr } = await supabase
    .from("aircraft")
    .select("id,registration_code,model,status")
    .eq("status", "ACTIVE")
    .order("registration_code");

  const { data: seatConfigs, error: sErr } = await supabase
    .from("seat_configurations")
    .select("id,aircraft_id,version,is_active")
    .eq("is_active", true)
    .order("version", { ascending: false });

  const err = rErr ?? aErr ?? sErr;
  if (err) {
    return (
      <Alert title="Load failed" tone="red">
        {err.message}
      </Alert>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Flights</div>
        <h1 className="mt-1 text-2xl font-semibold">Create Flight</h1>
        <div className="text-sm text-slate-700">Creates a scheduled flight and generates inventory.</div>
      </div>

      <Card title="New Flight" subtitle="Creates flight + seat inventory atomically">
        <CreateFlightForm
          routes={(routes ?? []) as any}
          aircraft={(aircraft ?? []) as any}
          seatConfigs={(seatConfigs ?? []) as any}
        />
      </Card>
    </section>
  );
}
