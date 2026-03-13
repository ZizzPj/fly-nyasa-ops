import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { MixedReservationForm } from "./MixedReservationForm";

type FlightRow = {
  flight_id: string;
  flight_number: string | null;
  departure_airport_name: string;
  via_airport_name: string | null;
  arrival_airport_name: string;
  departure_time: string | null;
  arrival_time: string | null;
  seats_available: number | null;
};

export default async function MixedReservationPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_operational_flights_display")
    .select(
      "flight_id, flight_number, departure_airport_name, via_airport_name, arrival_airport_name, departure_time, arrival_time, seats_available"
    )
    .order("departure_time", { ascending: true });

  if (error) {
    return (
      <Alert title="Flights load failed" tone="red">
        {error.message}
      </Alert>
    );
  }

  return (
    <section className="space-y-6">
      <Card title="Mixed Reservation" subtitle="Create linked seat and charter reservations in one workflow.">
        <MixedReservationForm flights={(data ?? []) as FlightRow[]} />
      </Card>
    </section>
  );
}